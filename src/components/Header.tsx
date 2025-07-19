import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import TopDrawerPanel from "@/components/TopDrawerPanel";
import MenuSideBar from "@/components/MenuSideBar";
import { RefreshCw } from "lucide-react";

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
  onRefreshSuggestedWords: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  hasUserMessages: boolean;
  showingSentences: boolean;
}

export default function Header({ 
  title, 
  children,
  onRefreshSuggestedWords,
  isLoading,
  isStreaming,
  hasUserMessages,
  showingSentences
}: HeaderProps) {

  const [showPanel, setShowPanel] = useState(false);
  const [currentIcon, setCurrentIcon] = useState(default_icon);
  const [currentName, setCurrentName] = useState(default_name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const chooseTypePerson = () => {
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
  };

  const change_icon = (iconDetails: { name: string; path: string }) => {
    setCurrentName(iconDetails.name);
    setCurrentIcon(iconDetails.path);
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
        <header className="w-full max-w-[390px] mx-auto mb-2 flex flex-row justify-between items-center px-4 gap-4 h-[34px] pt-8 pb-4">
          {/* Left Side: Menu Icon + Refresh Button */}
          <div className="flex flex-row items-center gap-6">
            {/* Menu Icon */}
            <Button
              data-track-click="Open menu clicked"
              data-analytics-button-name="Menu"
              variant="ghost"
              size="icon"
              className="p-0 h-6 w-8 hover:bg-transparent"
              title="תפריט"
              aria-label="תפריט"
              onClick={openMenu}
            >
              <img src="/icons/menu.png" alt="תפריט" className="h-6 w-8" />
            </Button>

            {/* Refresh Button */}
            {hasUserMessages && !showingSentences && (
              <button
                data-track-click="Refresh words clicked"
                data-analytics-button-name="Refresh Suggested Words"
                className="flex flex-row items-center justify-center gap-2 p-0 h-[21px] w-12 bg-transparent border-none cursor-pointer disabled:opacity-50"
                onClick={onRefreshSuggestedWords}
                disabled={!hasUserMessages || isStreaming || isLoading}
              >
                <RefreshCw className={`h-[21px] w-[15px] text-[#1A1A1A] ${isLoading ? 'animate-spin' : ''}`} />
                <span className="font-['Heebo'] font-normal text-[14px] leading-[21px] text-[#1A1A1A] w-[25px] h-[21px] flex items-center justify-end">רענן</span>
              </button>
            )}
          </div>

          {/* Centered Title */}
          {title && (
            <h1 className="text-2xl font-medium text-gray-900 flex-grow text-center">{title}</h1>
          )}

          {/* Right Side: Profile Name + Icon */}
          <div className="flex flex-row justify-end items-center gap-2 w-[120px] h-[34px]">
            <span className="font-['Heebo'] font-normal text-[14px] leading-[21px] text-[#6C6C6C] min-w-[60px] h-[10px] text-right whitespace-nowrap">{currentName}</span>
            <Button
              data-track-click="Change person type clicked"
              data-analytics-button-name="Change person type"
              data-analytics-current-person-type={currentName}
              variant="ghost"
              size="icon"
              title="בחר סוג שיחה"
              aria-label="בחר סוג שיחה"
              onClick={chooseTypePerson}
              className="flex justify-center items-center p-0 w-[34px] h-[34px] bg-white border border-[#2D2D2D] rounded-full hover:bg-gray-50"
            >
              <img
                src={currentIcon}
                alt="בחר סוג שיחה"
                className="w-[17.19px] h-[15.91px]"
              />
            </Button>
          </div>

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