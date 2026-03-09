import {db, auth} from '../firebase';
import { collection, addDoc, getDocs, Timestamp, doc} from 'firebase/firestore';


export const saveEvents = async (events: any[]) => {
    
    const user = auth.currentUser;
    if (!user) return;

    const eventsRef = collection(db, 'users', user.uid, 'events');

    //Iterate through events and save each one to Firestore
    for (const event of events) {
        await addDoc(eventsRef, {
            title: event.title,
            startDate: Timestamp.fromDate(event.startDate),
            endDate: Timestamp.fromDate(event.endDate),
            allDay: event.allDay,
            source: "google"
        });
    }
};    

export const loadEvents = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const snapshot = await getDocs(
        collection(db, 'users', user.uid, 'events')
    );

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate()
    }));
};
