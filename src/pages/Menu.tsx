// src/pages/Menu.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, History, Home, LogOut, User } from 'lucide-react';
import UserProfile from '@/components/UserProfile';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">תפריט</h1>
          <div className="w-10" /> {/* Spacer */}
                </div>

        {/* User Profile Section */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרופיל משתמש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <UserProfile />
                <div>
                  <p className="font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Options */}
        <Card>
          <CardHeader>
            <CardTitle>ניווט</CardTitle>
            <CardDescription>
              עבור בין דפי האפליקציה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              עמוד ראשי
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate('/history')}
            >
              <History className="mr-2 h-4 w-4" />
              היסטוריית שיחות
            </Button>
          </CardContent>
        </Card>

        {/* Authentication Section */}
        <Card>
          <CardHeader>
            <CardTitle>חשבון</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                התנתק
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <User className="mr-2 h-4 w-4" />
                התחבר
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Menu;
