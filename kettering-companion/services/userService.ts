import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Officer } from "../types/club";

export const getOfficersFromIds = async (
  ids: string[]
): Promise<Officer[]> => {

  const officers = await Promise.all(
    ids.map(async (uid) => {

      const userDoc = await getDoc(doc(db,"users",uid));

      if (!userDoc.exists()) return null;

      return {
        uid,
        ...(userDoc.data() as Omit<Officer,"uid">)
      };

    })
  );

  return officers.filter(Boolean) as Officer[];
};