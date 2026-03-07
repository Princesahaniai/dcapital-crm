import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useStore } from '../store';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
    const user = useStore(state => state.user);

    useEffect(() => {
        const registerPush = async () => {
            if (!user) return;

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const messaging = getMessaging();
                    const currentToken = await getToken(messaging, {
                        // Using VapidKey is often needed for web push, but for this context we will proceed with the default config unless specified. 
                        // If a vapid key is provided later, we can add it here.
                    });

                    if (currentToken) {
                        try {
                            const userRef = doc(db, 'users', user.id);
                            await updateDoc(userRef, { fcmToken: currentToken });
                        } catch (err) {
                            console.error('Error updating document with fcmToken:', err);
                        }
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                } else {
                    console.log('Notification permission not granted.');
                }
            } catch (error) {
                console.error('Error during push notification registration:', error);
            }
        };

        registerPush();
    }, [user]);

    return null;
};
