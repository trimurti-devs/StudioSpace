import emailjs from '@emailjs/browser';

// EmailJS configuration
// Sign up at https://www.emailjs.com/ to get your own service ID, template ID, and public key
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

export interface EmailData {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  [key: string]: string;
}

class EmailService {
  private initialized = false;

  constructor() {
    this.init();
  }

  init() {
    if (!this.initialized && EMAILJS_PUBLIC_KEY !== 'your_public_key') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      this.initialized = true;
    }
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (EMAILJS_PUBLIC_KEY === 'your_public_key') {
        console.warn('EmailJS not configured. Please add your EmailJS credentials to .env file');
        return false;
      }

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: data.to_email,
          to_name: data.to_name,
          subject: data.subject,
          message: data.message,
          ...data,
        }
      );

      if (response.status === 200) {
        console.log('Email sent successfully:', response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: 'Welcome to Studio Space! 🎨',
      message: `Hi ${userName},\n\nWelcome to Studio Space! We're excited to have you join our community of creators.\n\nStart building your aesthetic identity today by creating your first moodboard.\n\nHappy creating!\nThe Studio Space Team`,
    });
  }

  async sendBoardCreatedEmail(userEmail: string, userName: string, boardTitle: string): Promise<boolean> {
    const prefs = localStorage.getItem('user_preferences');
    const preferences = prefs ? JSON.parse(prefs) : { emailNotifications: true };
    
    if (!preferences.emailNotifications) return false;

    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: `Your moodboard "${boardTitle}" has been created! ✨`,
      message: `Hi ${userName},\n\nGreat news! Your moodboard "${boardTitle}" has been successfully created and saved.\n\nYou can view and edit it anytime from your dashboard.\n\nKeep creating!\nThe Studio Space Team`,
    });
  }

  async sendNewsletter(userEmail: string, userName: string): Promise<boolean> {
    const prefs = localStorage.getItem('user_preferences');
    const preferences = prefs ? JSON.parse(prefs) : { newsletter: false };
    
    if (!preferences.newsletter) return false;

    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: 'Your Weekly Inspiration from Studio Space 📬',
      message: `Hi ${userName},\n\nHere's your weekly dose of aesthetic inspiration!\n\n✨ Trending Tags: #sculptedshoulder, #80sluxury, #maximalist\n🎨 Featured Style: Corporate Goth Revival\n📸 Creator Spotlight: Check out the latest moodboards from our community\n\nCreate something beautiful today!\nThe Studio Space Team`,
    });
  }

  async sendPrivacyChangeEmail(userEmail: string, userName: string, isPublic: boolean): Promise<boolean> {
    const prefs = localStorage.getItem('user_preferences');
    const preferences = prefs ? JSON.parse(prefs) : { emailNotifications: true };
    
    if (!preferences.emailNotifications) return false;

    const status = isPublic ? 'public' : 'private';
    
    return this.sendEmail({
      to_email: userEmail,
      to_name: userName,
      subject: `Your profile is now ${status}`,
      message: `Hi ${userName},\n\nYour profile visibility has been changed to ${status}.\n\n${isPublic ? 'Other users can now see your profile and public moodboards.' : 'Your profile is now private and only visible to you.'}\n\nYou can change this anytime in your account settings.\n\nBest,\nThe Studio Space Team`,
    });
  }
}

export const emailService = new EmailService();
