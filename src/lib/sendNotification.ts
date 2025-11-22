import { supabase } from "@/integrations/supabase/client";

interface NotificationContent {
  en: { title: string; message: string };
  ar: { title: string; message: string };
}

export async function sendNotification(
  userId: string,
  content: NotificationContent,
  lang: 'en' | 'ar' = 'en',
  metadata: any = {}
) {
  const notification = lang === 'ar' ? content.ar : content.en;

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title: notification.title,
    message: notification.message,
    lang,
    metadata
  });

  if (error) {
    console.error('Failed to send notification:', error);
  }
}

export const NotificationTemplates = {
  NEW_BOOKING: {
    en: {
      title: "New Booking Request",
      message: "You have a new booking request for your dorm!"
    },
    ar: {
      title: "طلب حجز جديد",
      message: "لديك طلب حجز جديد للسكن الخاص بك!"
    }
  },
  NEW_INQUIRY: {
    en: {
      title: "New Inquiry",
      message: "A student is interested in your dorm"
    },
    ar: {
      title: "استفسار جديد",
      message: "طالب مهتم بالسكن الخاص بك"
    }
  },
  TOUR_BOOKED: {
    en: {
      title: "Virtual Tour Booked",
      message: "A student has booked a virtual tour"
    },
    ar: {
      title: "تم حجز جولة افتراضية",
      message: "قام طالب بحجز جولة افتراضية"
    }
  }
};
