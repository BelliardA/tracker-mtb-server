import { version } from 'ethers';
import { MongoClient, ServerApiVersion, Db } from 'mongodb';


const uri = process.env.ATLAS_URI;

if (!uri) {
  throw new Error('❌ Missing ATLAS_URI in environment variables.');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

(async () => {
  try {
    await client.connect();

    //envoyé un ping de confirmation de connection
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Pinged your deployment. Connected to MongoDB!');
  } catch (e) {
    console.error('❌ MongoDB connection error:', e);
  }
})();

const db: Db = client.db('recherche');

export default db;
