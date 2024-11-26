const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Add Blocked Term Function
exports.addBlockedTerm = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { term } = req.body;
      console.log("Received request to add term:", term);

      if (!term || typeof term !== "string") {
        return res.status(400).send({ success: false, error: "The term field is required and must be a string." });
      }

      const blockedTermsRef = db.collection("blockedTerms");
      const termExists = await blockedTermsRef.where("term", "==", term.toLowerCase()).get();

      if (!termExists.empty) {
        return res.status(400).send({ success: false, error: "Term already exists." });
      }

      await blockedTermsRef.add({ term: term.toLowerCase() });
      return res.status(200).send({ success: true, message: "Term added successfully." });
    } catch (error) {
      console.error("Error adding blocked term:", error);
      return res.status(500).send({ success: false, error: "Failed to add term." });
    }
  });
});

// Get Blocked Terms Function
exports.getBlockedTerms = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const blockedTermsRef = db.collection("blockedTerms");
        const snapshot = await blockedTermsRef.get();
        const terms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
        // Ensure the response is in JSON format
        res.status(200).json({ success: true, terms });
      } catch (error) {
        console.error("Error fetching blocked terms:", error);
        res.status(500).json({ success: false, error: "Failed to fetch terms." });
      }
    });
  });
  

// Delete Blocked Term Function
exports.deleteBlockedTerm = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { term } = req.body;
      console.log("Received request to delete term:", term);

      if (!term || typeof term !== "string") {
        return res.status(400).send({ success: false, error: "The term field is required and must be a string." });
      }

      const blockedTermsRef = db.collection("blockedTerms");
      const termToDelete = await blockedTermsRef.where("term", "==", term.toLowerCase()).get();

      if (termToDelete.empty) {
        return res.status(400).send({ success: false, error: "Term not found." });
      }

      await termToDelete.docs[0].ref.delete();
      return res.status(200).send({ success: true, message: "Term deleted successfully." });
    } catch (error) {
      console.error("Error deleting blocked term:", error);
      return res.status(500).send({ success: false, error: "Failed to delete term." });
    }
  });
});
