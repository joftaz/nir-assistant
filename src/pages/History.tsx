import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getAllHistories,
  deleteHistory
} from '@/utils/conversationManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import Header from '@/components/Header';

const default_icon = "/icons/typePerson/type-person-person.svg";
const default_name = "אדם זר";

const History: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [histories, setHistories] = useState(() => {
    const allHistories = getAllHistories();
    return allHistories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);

  const handleLoadHistory = (id: string) => {
    navigate(`/?history=${id}`);
  };

  const confirmDeleteHistory = (id: string) => {
    setHistoryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteHistory = () => {
    if (historyToDelete) {
      deleteHistory(historyToDelete);
      const allHistories = getAllHistories();
      setHistories(allHistories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      setIsDeleteDialogOpen(false);

      toast({
        title: "השיחה נמחקה",
        description: "השיחה נמחקה בהצלחה",
      });
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "d בMMMM yyyy, HH:mm", { locale: he });
  };

  const getPreviewText = (history: any) => {
    if (!history.messages || history.messages.length === 0) {
      return "שיחה ריקה";
    }
    const firstUserMessage = history.messages.find((msg: any) => msg.isUser);
    return firstUserMessage ? firstUserMessage.text : "שיחה ריקה";
  };

  const handleStartNewConversation = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex justify-start px-4 mb-8 mt-6 w-full">
        <h1 className="text-2xl font-medium text-gray-900 text-right w-full" dir="rtl">היסטוריה</h1>
      </div>

      <div className="flex-1 px-4">
        {histories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">אין שיחות שמורות</p>
            {/* Center the button in the empty state */}
            <div className="flex justify-center mt-10">
              <Button
                variant="figma"
                onClick={handleStartNewConversation}
              >
                התחל שיחה חדשה
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {histories.map((history) => (
                <motion.div
                  key={history.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="flex-1 cursor-pointer text-right"
                    onClick={() => handleLoadHistory(history.id)}
                  >
                    <h3 className="font-bold text-gray-900 mb-1 text-right">
                      {getPreviewText(history)}
                    </h3>
                    <p className="text-sm text-gray-500 text-right">
                      {formatDate(history.updatedAt)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteHistory(history.id);
                    }}
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* NEW: Wrapper for the button to align it left */}
            <div className="flex justify-end mt-10">
              <Button
                variant="figma"
                onClick={handleStartNewConversation}
              >
                התחל שיחה חדשה
              </Button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת שיחה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את השיחה הזו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHistory} className="bg-destructive text-destructive-foreground">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;