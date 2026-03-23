import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export class UserService {
  static async findUserByEmail(email: string) {
      const q = query(
          collection(db, "users"),
          where("email", "==", email)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0];
  };
}
