// src/components/MenuSideBar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { X, User } from 'lucide-react';

interface MenuSideBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuSideBar: React.FC<MenuSideBarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  // Note: user and signOut are kept for logic but removed from UI per Figma design.
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuItemClick = (onClick: () => void, disabled: boolean = false) => {
    if (disabled) {
      return; // Block the click for disabled items
    }
    onClick();
    onClose(); // Close the menu after clicking an item
  };

  const handleLoginClick = () => {
    navigate('/login');
    onClose();
  };

  const menuItems = [
    {
      id: 'settings',
      title: 'הגדרות',
      disabled: true, // Block settings
      onClick: () => {
        // TODO: Navigate to settings page when implemented
        console.log('Settings clicked');
      }
    },
    {
      id: 'profile',
      title: 'פרופיל',
      disabled: true, // Block profile
      onClick: () => {
        // TODO: Navigate to profile page when implemented
        console.log('Profile clicked');
      }
    },
    {
      id: 'history',
      title: 'היסטוריה',
      disabled: false,
      onClick: () => navigate('/history')
    }
  ];

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      direction="right"
      size={320} // Width for mobile, will be responsive
      duration={300}
      overlayOpacity={0.3}
      overlayColor="#000000"
      enableOverlay={true}
      lockBackgroundScroll={true}
      className="drawer-content bg-menu_bg_color"
      style={{
        direction: 'rtl',
      }}
    >
      <div className="h-full flex flex-col" dir="rtl">
        {/* Header with close button */}
        <div className="w-full text-left py-6 pr-6 pl-4">
          <X
            className="h-8 w-8 cursor-pointer text-black hover:text-gray-700 transition-colors"
            onClick={onClose}
            strokeWidth={2.5}
            aria-label="Close Menu"
          />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 sm:px-6 pt-4">
          <div className="space-y-8 sm:space-y-10">
            {menuItems.map((item) => (
              <div key={item.id} className="text-right">
                <Button
                  data-track-click={`${item.id} clicked`}
                  data-analytics-button-name={item.title}
                  variant="ghost"
                  disabled={item.disabled}
                  className={`h-auto p-0 text-2xl sm:text-3xl md:text-4xl font-medium text-right w-auto justify-start transition-all duration-200 ${
                    item.disabled 
                      ? 'text-gray-400 cursor-not-allowed hover:bg-transparent hover:text-gray-400' 
                      : 'text-foreground hover:bg-transparent hover:text-muted-foreground focus-visible:ring-0'
                  }`}
                  onClick={() => handleMenuItemClick(item.onClick, item.disabled)}
                >
                  {item.title}
                </Button>
              </div>
            ))}
          </div>
        </nav>

        {/* User Authentication Section at Bottom */}
        <div className="p-6 sm:p-8 border-t border-gray-100">
          <div className="text-right">
            {user ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="flex items-center justify-end gap-3 mb-2">
                  <div className="text-base font-medium text-gray-800">
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'משתמש'}
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </div>
                {/* Logout Button */}
                <Button
                  data-track-click="Logout clicked"
                  data-analytics-button-name="Logout"
                  variant="ghost"
                  className="h-auto p-0 text-xl sm:text-2xl font-medium text-foreground hover:bg-transparent hover:text-muted-foreground focus-visible:ring-0 transition-all duration-200 text-right w-auto justify-start"
                  onClick={handleSignOut}
                >
                  התנתקות
                </Button>
              </div>
            ) : (
              <Button
                data-track-click="Login clicked"
                data-analytics-button-name="Login"
                variant="ghost"
                className="h-auto p-0 text-xl sm:text-2xl font-medium text-foreground hover:bg-transparent hover:text-muted-foreground focus-visible:ring-0 transition-all duration-200 text-right w-auto justify-start"
                onClick={handleLoginClick}
              >
                התחברות
              </Button>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default MenuSideBar;