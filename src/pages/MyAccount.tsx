import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { emailService } from "@/lib/email-service";

import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Calendar, 
  Camera, 
  LogOut, 
  Trash2, 
  ArrowLeft, 
  Shield, 
  Bell, 
  Palette,
  Loader2,
  Check,
  Moon,
  Globe,
  Grid3X3,
  ImageIcon,
  Tag,
  Clock,
  Eye,
  Lock,
  Sparkles
} from "lucide-react";


interface UserPreferences {
  emailNotifications: boolean;
  publicProfile: boolean;
  newsletter: boolean;
  darkMode: boolean;
  language: string;
  autoSave: boolean;
  showStats: boolean;
}

interface ActivityStats {
  moodboards: number;
  images: number;
  tags: number;
  publicBoards: number;
  privateBoards: number;
  lastActive: string;
}

const MyAccount = () => {
  const { user, isAuthenticated, logout, deleteAccount, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [stats, setStats] = useState<ActivityStats>({
    moodboards: 0,
    images: 0,
    tags: 0,
    publicBoards: 0,
    privateBoards: 0,
    lastActive: "Never",
  });
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    publicProfile: true,
    newsletter: false,
    darkMode: false,
    language: "en",
    autoSave: true,
    showStats: true,
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    birthDate: user?.birthDate || "",
  });

  // Load preferences and stats
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem("user_preferences");
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
    
    // Calculate real stats from boards
    const calculateStats = () => {
      let moodboards = 0;
      let images = 0;
      let tags = 0;
      let publicBoards = 0;
      let privateBoards = 0;
      let lastActive = user?.createdAt || new Date().toISOString();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("board_")) {
          try {
            const boardData = localStorage.getItem(key);
            if (boardData) {
              const board = JSON.parse(boardData);
              moodboards++;
              
              // Count images
              const canvasImages = board.canvasImages?.length || 0;
              const legacyImages = board.images?.length || 0;
              images += canvasImages + legacyImages;
              
              // Count tags
              tags += board.tags?.length || 0;
              
              // Count public/private
              if (board.isPublic) {
                publicBoards++;
              } else {
                privateBoards++;
              }
              
              // Track last active
              if (board.updatedAt) {
                const boardDate = new Date(board.updatedAt);
                const currentLast = new Date(lastActive);
                if (boardDate > currentLast) {
                  lastActive = board.updatedAt;
                }
              }
            }
          } catch (e) {
            console.error("Failed to parse board:", e);
          }
        }
      }
      
      setStats({
        moodboards,
        images,
        tags,
        publicBoards,
        privateBoards,
        lastActive: formatLastActive(lastActive),
      });
    };
    
    calculateStats();
  }, [isAuthenticated, user]);

  const formatLastActive = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const savePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem("user_preferences", JSON.stringify(updated));
    
    // Send email if privacy setting changed
    if (newPrefs.publicProfile !== undefined && user) {
      await emailService.sendPrivacyChangeEmail(
        user.email, 
        user.name, 
        newPrefs.publicProfile
      );
    }
    
    toast({
      title: "Preferences updated",
      description: "Your settings have been saved.",
    });
  };


  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/sign-in");
    return null;
  }


  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const avatarUrl = event.target?.result as string;
        updateUser({ avatar: avatarUrl });
        toast({
          title: "Avatar updated!",
          description: "Your profile picture has been updated.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    updateUser({
      name: formData.name,
      email: formData.email,
      birthDate: formData.birthDate,
    });
    
    setIsSaving(false);
    setIsEditing(false);
    
    toast({
      title: "Profile updated!",
      description: "Your changes have been saved.",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    deleteAccount();
    navigate("/");
    toast({
      title: "Account deleted",
      description: "Your account has been permanently deleted.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="dashboard" />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">My Account</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="text-center pb-4">
                <div className="relative mx-auto w-fit">
                  <Avatar 
                    className="h-32 w-32 cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <CardTitle className="mt-4 font-serif text-xl">{user?.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {user?.email}
                </CardDescription>
                <Badge variant="outline" className="mt-2 rounded-2xl">
                  Member since {new Date(user?.createdAt || "").toLocaleDateString()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profile</p>
                      <p className="text-xs text-muted-foreground">
                        {preferences.publicProfile ? "Public" : "Private"}
                      </p>
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>

                
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Account</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-2xl border-border/50 mt-6">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full rounded-xl justify-start gap-3"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
                <Button
                  variant="destructive"
                  className="w-full rounded-xl justify-start gap-3"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Profile Information */}
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl">Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className="rounded-xl"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="rounded-xl h-12"
                      />
                    ) : (
                      <div className="p-3 bg-secondary/50 rounded-xl text-sm">
                        {user?.name}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Address
                    </Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="rounded-xl h-12"
                      />
                    ) : (
                      <div className="p-3 bg-secondary/50 rounded-xl text-sm">
                        {user?.email}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Birth Date
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="rounded-xl h-12"
                      />
                    ) : (
                      <div className="p-3 bg-secondary/50 rounded-xl text-sm">
                        {user?.birthDate ? new Date(user.birthDate).toLocaleDateString() : "Not set"}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="rounded-xl gradient-gold border-0 text-primary-foreground"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="rounded-2xl border-border/50">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your moodboards
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => savePreferences({ emailNotifications: checked })}
                  />
                </div>
                <Separator />
                
                {/* Public Profile */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Public Profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your profile and public boards
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.publicProfile}
                    onCheckedChange={(checked) => savePreferences({ publicProfile: checked })}
                  />
                </div>
                <Separator />
                
                {/* Newsletter */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Weekly Newsletter
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get inspiration and tips every week
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.newsletter}
                    onCheckedChange={(checked) => savePreferences({ newsletter: checked })}
                  />
                </div>
                <Separator />
                
                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Auto Save
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes while editing
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => savePreferences({ autoSave: checked })}
                  />
                </div>
                <Separator />
                
                {/* Show Stats */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-primary" />
                      Show Activity Stats
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display your activity statistics on dashboard
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.showStats}
                    onCheckedChange={(checked) => savePreferences({ showStats: checked })}
                  />
                </div>
                <Separator />
                
                {/* Language */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Language
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred language
                    </p>
                  </div>
                  <Select 
                    value={preferences.language}
                    onValueChange={(value) => savePreferences({ language: value })}
                  >
                    <SelectTrigger className="w-[140px] rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>


            {/* Stats */}
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Activity
                </CardTitle>
                <Badge variant="outline" className="rounded-full">
                  <Clock className="h-3 w-3 mr-1" />
                  Last active {stats.lastActive}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                    <p className="text-3xl font-serif font-light text-primary">{stats.moodboards}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Grid3X3 className="h-3 w-3" /> Moodboards
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <p className="text-3xl font-serif font-light">{stats.images}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Images
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <p className="text-3xl font-serif font-light">{stats.tags}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Tag className="h-3 w-3" /> Tags
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <p className="text-3xl font-serif font-light">{stats.publicBoards}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" /> Public
                    </p>
                  </div>
                </div>
                
                {stats.moodboards > 0 && (
                  <div className="mt-4 p-3 bg-secondary/30 rounded-xl">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Private boards
                      </span>
                      <span className="font-medium">{stats.privateBoards}</span>
                    </div>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ 
                          width: `${stats.moodboards > 0 ? (stats.publicBoards / stats.moodboards) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {stats.publicBoards} public / {stats.privateBoards} private
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Log Out?</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleLogout} className="rounded-xl gradient-gold border-0 text-primary-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-destructive">Delete Account?</DialogTitle>
            <DialogDescription className="text-destructive/80">
              This action cannot be undone. This will permanently delete your account and all your data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              className="rounded-xl"
              disabled={deleteConfirmText !== "DELETE"}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAccount;
