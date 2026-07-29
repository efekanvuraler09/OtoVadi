import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNQrz9sTwENlIMa3eLHgiC9gQBHQ8b0MA",
  authDomain: "otovadi-99993.firebaseapp.com",
  projectId: "otovadi-99993",
  storageBucket: "otovadi-99993.firebasestorage.app",
  messagingSenderId: "514411081824",
  appId: "1:514411081824:web:fb64854555362030851305"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const WIKI_IMAGES = {
  "Kia Cerato": "https://upload.wikimedia.org/wikipedia/commons/f/f6/2019_Kia_Forte_EX_in_Snow_White_Pearl%2C_Front_Left%2C_08-04-2022.jpg",
  "Opel Astra": "https://upload.wikimedia.org/wikipedia/commons/1/18/Opel_Astra_L_1.2_Turbo_Elegance_Front_20221015.jpg",
  "Ford Mustang GT": "https://upload.wikimedia.org/wikipedia/commons/4/44/2024_Ford_Mustang_GT_in_Grabber_Blue%2C_front_right.jpg",
  "Dodge Challenger SRT": "https://upload.wikimedia.org/wikipedia/commons/4/42/2019_Dodge_Challenger_SRT_Hellcat_Redeye_Front.jpg",
  "Dodge Charger SRT": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Dodge_Charger_SRT_Hellcat_-_Flickr_-_K%C3%A2rlis_Dambr%C4%81ns_%281%29.jpg",
  "Chevrolet Camaro ZL1": "https://upload.wikimedia.org/wikipedia/commons/6/69/2018_Chevrolet_Camaro_ZL1.jpg",
  "Dodge Charger R/T": "https://upload.wikimedia.org/wikipedia/commons/3/30/1970_Dodge_Charger_500.jpg",
  "Dodge Challenger R/T": "https://upload.wikimedia.org/wikipedia/commons/2/23/1970_Dodge_Challenger_R-T.jpg"
};

async function recover() {
  const querySnapshot = await getDocs(collection(db, "vehicles"));
  
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const currentId = docSnap.id;
    const isRandomId = currentId.length >= 20 && !currentId.includes("-");
    const isMuscle = data.segment === "muscle-car" || data.bodyType === "muscle-car" || data.brand === "Dodge" || data.model.includes("Camaro") || data.model.includes("Mustang");
    
    let docRef = doc(db, "vehicles", currentId);
    let finalId = currentId;
    
    // Fix bodyType for muscle cars
    if (isMuscle && data.bodyType !== "muscle-car") {
      data.bodyType = "muscle-car";
      data.segment = "muscle-car";
    }

    // Replace ID if it's random OR if we needed to update bodyType for a muscle car that had an old ID
    if (isRandomId || isMuscle) {
      // Force clean ID format
      const cleanId = `${data.brand.toLowerCase()}-${data.model.toLowerCase().replace(/[\/\s]+/g, '-')}-${data.year}`;
      
      if (currentId !== cleanId) {
        console.log(`Found bad ID or migrating: ${currentId} -> ${cleanId}`);
        const updatedData = { ...data, id: cleanId };
        
        // Save with new ID
        await setDoc(doc(db, "vehicles", cleanId), updatedData);
        
        // Delete old document if it wasn't the exact same ID
        await deleteDoc(doc(db, "vehicles", currentId));
        
        docRef = doc(db, "vehicles", cleanId);
        finalId = cleanId;
        Object.assign(data, updatedData);
      } else if (isMuscle) {
         // Just update the bodyType in place
         await updateDoc(docRef, { bodyType: "muscle-car", segment: "muscle-car" });
      }
    }
    
    // Fix Images EXACTLY as requested
    let targetImage = null;
    
    if (data.brand === "Kia" && data.model.includes("Cerato")) targetImage = WIKI_IMAGES["Kia Cerato"];
    if (data.brand === "Opel" && data.model.includes("Astra")) targetImage = WIKI_IMAGES["Opel Astra"];
    if (data.brand === "Ford" && data.model.includes("Mustang")) targetImage = WIKI_IMAGES["Ford Mustang GT"];
    if (data.brand === "Dodge" && data.model.includes("Challenger SRT")) targetImage = WIKI_IMAGES["Dodge Challenger SRT"];
    if (data.brand === "Dodge" && data.model.includes("Charger SRT")) targetImage = WIKI_IMAGES["Dodge Charger SRT"];
    if (data.brand === "Chevrolet" && data.model.includes("Camaro")) targetImage = WIKI_IMAGES["Chevrolet Camaro ZL1"];
    if (data.brand === "Dodge" && data.model.includes("Charger R/T")) targetImage = WIKI_IMAGES["Dodge Charger R/T"];
    if (data.brand === "Dodge" && data.model.includes("Challenger R/T")) targetImage = WIKI_IMAGES["Dodge Challenger R/T"];

    if (targetImage) {
      await updateDoc(docRef, {
        "media.heroImage": targetImage,
        "media.thumbnail": targetImage,
        "interactiveGallery.studioImage": targetImage
      });
      console.log(`Updated images for ${data.brand} ${data.model} at ID ${finalId}`);
    }
  }
  
  console.log("RECOVERY COMPLETE");
  process.exit(0);
}

recover().catch(console.error);
