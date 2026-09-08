const admin = require("firebase-admin");

// Load your service account key (same one used in deleteUsers.js)
const serviceAccount = require("./hhs-nhs-firebase-adminsdk-19ctb-fd989ad11e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Resets hour fields for every document in the `users` collection.
 * - regularHours -> 0
 * - projectHours -> 0
 * - socialHours  -> 0
 *
 * Uses batched writes (max 400 per batch for safety).
 */
async function resetAllUserHours() {
  console.log("Fetching all user documents from 'users' collection...");

  const snapshot = await db.collection("users").get();
  console.log(`Found ${snapshot.size} user documents.`);

  if (snapshot.empty) {
    console.log("No user documents found. Nothing to reset.");
    return;
  }

  const docs = snapshot.docs;
  let batch = db.batch();
  let counter = 0;
  let batchNumber = 1;

  for (const doc of docs) {
    const ref = doc.ref;

    batch.update(ref, {
      regularHours: 0,
      projectHours: 0,
      socialHours: 0,
    });

    counter++;

    // Firestore allows up to 500 operations per batch; use 400 as a buffer.
    if (counter % 400 === 0) {
      console.log(`Committing batch ${batchNumber} (400 updates)...`);
      await batch.commit();
      batchNumber++;
      batch = db.batch();
    }
  }

  // Commit any remaining operations in the last batch
  if (counter % 400 !== 0) {
    console.log(`Committing final batch ${batchNumber} (${counter % 400} updates)...`);
    await batch.commit();
  }

  console.log(`Done. Reset hours for ${counter} user documents.`);
}

resetAllUserHours()
  .then(() => {
    console.log("Hour reset script completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error while resetting user hours:", err);
    process.exit(1);
  });


