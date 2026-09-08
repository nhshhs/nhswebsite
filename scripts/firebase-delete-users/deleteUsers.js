const admin = require("firebase-admin");

// Load your service account key
const serviceAccount = require("./hhs-nhs-firebase-adminsdk-19ctb-fd989ad11e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function deleteAllUsers() {
  let result = await admin.auth().listUsers(1000);

  while (result.users.length > 0) {
    const uids = result.users.map(user => user.uid);
    await admin.auth().deleteUsers(uids);
    console.log(`Deleted ${uids.length} users`);

    if (result.pageToken) {
      result = await admin.auth().listUsers(1000, result.pageToken);
    } else {
      break;
    }
  }
  console.log("All users deleted.");
}

deleteAllUsers().catch(console.error);
