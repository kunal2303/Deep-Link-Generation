import { db } from "../firebase";
import { collection, deleteDoc, doc, setDoc, getDoc, getDocs, query, serverTimestamp, increment, updateDoc, where } from "firebase/firestore";
import { nanoid } from "nanoid";

const LINKS_COLLECTION = "links";

export const createLink = async ({ targetUrl, customSlug = "", title, userId }) => {
  if (!userId) {
    throw new Error("Authentication required");
  }

  const slug = customSlug.trim() !== "" ? customSlug.trim() : nanoid(6);
  const docRef = doc(db, LINKS_COLLECTION, slug);
  
  // Check if custom slug already exists
  if (customSlug.trim() !== "") {
    const existingDoc = await getDoc(docRef);
    if (existingDoc.exists()) {
      throw new Error("Slug already in use");
    }
  }

  await setDoc(docRef, {
    targetUrl,
    title: title.trim(),
    userId,
    createdAt: serverTimestamp(),
    clicks: 0
  });

  return slug;
};

export const fetchLinksForUser = async (userId) => {
  if (!userId) {
    return [];
  }

  const linksQuery = query(collection(db, LINKS_COLLECTION), where("userId", "==", userId));
  const snapshot = await getDocs(linksQuery);

  return snapshot.docs
    .map((linkDoc) => ({
      slug: linkDoc.id,
      ...linkDoc.data()
    }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
};

export const deleteLinkForUser = async (slug, userId) => {
  if (!slug || !userId) {
    throw new Error("Authentication required");
  }

  const docRef = doc(db, LINKS_COLLECTION, slug);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Link not found");
  }

  if (docSnap.data().userId !== userId) {
    throw new Error("Permission denied");
  }

  await deleteDoc(docRef);
};

export const fetchLinkBySlug = async (slug) => {
  const docRef = doc(db, LINKS_COLLECTION, slug);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Increment clicks
    updateDoc(docRef, { clicks: increment(1) }).catch(err => console.error("Failed to increment clicks", err));
    return docSnap.data();
  }
  return null;
};
