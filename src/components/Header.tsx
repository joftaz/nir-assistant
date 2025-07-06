import { Button } from "@/components/ui/button";
import { ReactNode, useEffect, useState } from "react";
import TopDrawerPanel from "@/components/TopDrawerPanel";
import MenuSideBar from "@/components/MenuSideBar";

const default_icon = "/icons/typePerson/type-person-person.svg";
const default_name = "אדם זר";

const icons_first = [
  { path: "icons/typePerson/type-person-kid.svg", name: "ילד" },
  { path: "/icons/typePerson/type-person-close-person.svg", name: "אדם קרוב" },
  { path: default_icon, name: "אדם זר" }
];

const icons_second = [
  { path: "/icons/typePerson/type-person-professional.svg", name: "איש מקצוע" },
  { path: "/icons/typePerson/type-person-add-new-contact.svg", name: "הוסף איש קשר" }
];


interface HeaderProps {
  title?: string;
  children?: ReactNode;
  selectedPartner: string;
  setSelectedPartner: (partner: string) => void;
}

export default function Header({ 
  title, 
  children,
  selectedPartner,
  setSelectedPartner
 }: HeaderProps) {

  const [showPanel, setShowPanel] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(default_icon);
  const [currentName, setCurrentName] = useState(default_name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    setSelectedPartner(default_name);
  }, [setSelectedPartner]);

  const chooseTypePerson = () => {
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
  };

  const change_icon = (iconDetails: { name: string; path: string }) => {
    setCurrentName(iconDetails.name);
    setCurrentIcon(iconDetails.path);
    setSelectedPartner(iconDetails.name);
    setShowPanel(false);
  };

  const openMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {!showPanel && (
        <header className="w-full max-w-3xl mx-auto mb-2 text-center relative pt-8 pb-4">
          {/* Right Side: Profile Icon + Name */}
          <div className="absolute top-0 right-0 flex items-center gap-2 p-2">
            <div className="h-11 w-11 rounded-full flex items-center justify-center">
              <Button
                data-track-click="Change person type clicked"
                data-analytics-button-name="Change person type"
                data-analytics-current-person-type={currentName}
                variant="ghost"
                size="icon"
                title="בחר סוג שיחה"
                aria-label="בחר סוג שיחה"
                onClick={chooseTypePerson}
              >
                <img
                  src={currentIcon}
                  alt="בחר סוג שיחה"
                  className="h-11 w-11"
                />
              </Button>
            </div>
            <span>{currentName}</span>
          </div>

          {/* Left Side: Menu Icon */}
          <div className="absolute top-0 left-0 flex gap-2 p-2">
            <Button
              data-track-click="Open menu clicked"
              data-analytics-button-name="Menu"
              variant="ghost"
              size="icon"
              className="rounded-full"
              title="תפריט"
              aria-label="תפריט"
              onClick={openMenu}
            >
              <img src="/icons/menu.png" alt="תפריט" className="h-5 w-5" />
            </Button>
          </div>

          {/* Centered Title */}
          {title && (
            <h1 className="text-2xl font-medium text-gray-900 mt-4 mb-0">{title}</h1>
          )}
          {/* Optional children below title */}
          {children}
        </header>
      )}

      {/* Top Drawer Panel */}
      <TopDrawerPanel
        showPanel={showPanel}
        closePanel={closePanel}
        icons_first={icons_first}
        icons_second={icons_second}
        change_icon={change_icon}
      />

      {/* Menu Drawer */}
      <MenuSideBar isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  );
} 