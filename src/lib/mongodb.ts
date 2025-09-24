import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found. Using mock data where applicable. The app will not connect to a database.')
}

const uri = process.env.MONGODB_URI || ''
let client: MongoClient | undefined
let clientPromise: Promise<MongoClient> | undefined

// In development mode, use a global variable so that the value
// is preserved across module reloads caused by HMR (Hot Module Replacement).
let globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    if (uri) {
      client = new MongoClient(uri)
      globalWithMongo._mongoClientPromise = client.connect()
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  if (uri) {
    client = new MongoClient(uri)
    clientPromise = client.connect()
  }
}


// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
