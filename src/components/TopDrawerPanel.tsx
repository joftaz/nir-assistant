import React from 'react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface IconDetails {
  path: string;
  name: string;
}

interface TopDrawerPanelProps {
  showPanel: boolean;
  closePanel: () => void;
  icons_first: IconDetails[];
  icons_second: IconDetails[];
  change_icon: (icon: IconDetails) => void;
}

const TopDrawerPanel: React.FC<TopDrawerPanelProps> = ({
  showPanel,
  closePanel,
  icons_first,
  icons_second,
  change_icon,
}) => {
  return (
    <Drawer
      open={showPanel}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
    >
      <DrawerContent
        handlePosition="bottom"
        className="
          fixed top-0 left-0 right-0 
          h-1/2 
          rounded-b-xl 
          shadow-xl 
          bg-white 
          flex flex-col items-center justify-center 
          transition-transform duration-300 ease-out
          data-[state=open]:translate-y-0 
          data-[state=closed]:-translate-y-full
          z-50
        "
      >
        <div className="w-full text-center">
          {/* First Row */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {icons_first.map((icon, index) => (
              <Button
                data-track-click="Choose person type clicked"
                data-analytics-button-name="Choose person type"
                data-analytics-choosen-person-type={icon.name} 
                key={index}
                variant="ghost"
                size="icon"
                className="rounded-full"
                title={icon.name}
                aria-label={icon.name}
                onClick={() => change_icon(icon)}
                style={{ width: '75px', height: '75px' }}
              >
                <img
                  src={icon.path}
                  alt={icon.name}
                  className="h-10 w-10 mb-1"
                />
              </Button>
            ))}
          </div>

          {/* Second Row */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {icons_second.map((icon, index) => (
              <Button
                data-track-click="Choose person type clicked"
                data-analytics-button-name="Choose person type"
                data-analytics-choosen-person-type={icon.name} 
                key={index}
                variant="ghost"
                size="icon"
                className="rounded-full"
                title={icon.name}
                aria-label={icon.name}
                onClick={() => change_icon(icon)}
                style={{ width: '75px', height: '75px' }}
              >
                <img
                  src={icon.path}
                  alt={icon.name}
                  className="h-10 w-10"
                />
              </Button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TopDrawerPanel;