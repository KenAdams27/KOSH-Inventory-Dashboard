import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!process.env.MONGODB_URI) {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  
  if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClientPromise) {
      // Create a mock client and promise if MONGODB_URI is not set
      client = new MongoClient('')
      globalWithMongo._mongoClientPromise = Promise.resolve(client) as Promise<MongoClient>;
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient('');
    clientPromise = Promise.resolve(client) as Promise<MongoClient>;
  }
} else {
    if (process.env.NODE_ENV === 'development') {
        let globalWithMongo = global as typeof globalThis & {
            _mongoClientPromise?: Promise<MongoClient>
        }
        if (!globalWithMongo._mongoClientPromise) {
            client = new MongoClient(uri)
            globalWithMongo._mongoClientPromise = client.connect()
        }
        clientPromise = globalWithMongo._mongoClientPromise
    } else {
        client = new MongoClient(uri)
        clientPromise = client.connect()
    }
}


// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
