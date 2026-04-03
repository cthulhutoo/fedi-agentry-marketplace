import { createId } from "@paralleldrive/cuid2"
import { InferSelectModel, relations } from "drizzle-orm"
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  decimal,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"

/** Core User Model */
export const user = pgTable("User", {
  id: serial("id").primaryKey().notNull().unique(),
  pubkey: text("pubkey").notNull().unique(),
  npub: text("npub").notNull(),
  nip05: text("nip05"),
  agentId: text("agentId"), // Agentry agent ID if registered
  did: text("did"), // Agentry DID
  reputationScore: decimal("reputationScore", { precision: 3, scale: 2 }).default("0"),
  totalTransactions: integer("totalTransactions").default(0),
  successfulTransactions: integer("successfulTransactions").default(0),
  timeCreated: timestamp("timeCreated", {
    precision: 3,
    withTimezone: true,
    mode: "string",
  })
    .defaultNow()
    .notNull(),
  lastLogin: timestamp("lastLogin", {
    precision: 3,
    withTimezone: true,
    mode: "string",
  }),
})

/** Session for Auth */
export const session = pgTable(
  "Session",
  {
    id: serial("id").primaryKey().notNull().unique(),
    userId: integer("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    token: text("token")
      .notNull()
      .unique()
      .$default(() => createId()),
    sigToken: text("sigToken")
      .notNull()
      .unique()
      .$default(() => createId()),
  },
  table => ({
    userIdIndex: uniqueIndex("idx_session_user_id").on(table.userId),
  }),
)

/** Marketplace Listings */
export const listing = pgTable(
  "Listing",
  {
    id: serial("id").primaryKey().notNull().unique(),
    cuid: text("cuid")
      .notNull()
      .unique()
      .$default(() => createId()),
    sellerId: integer("sellerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    priceSats: integer("priceSats").notNull(),
    currency: text("currency").default("SATS"),
    category: text("category").notNull(), // electronics, furniture, vehicles, etc
    condition: text("condition"), // new, like_new, good, fair, poor
    location: text("location"), // city/region
    lat: decimal("lat", { precision: 10, scale: 6 }),
    lng: decimal("lng", { precision: 10, scale: 6 }),
    images: jsonb("images").$type<string[]>().default([]),
    status: text("status").default("active"), // active, sold, cancelled, pending
    escrowEnabled: boolean("escrowEnabled").default(true),
    directPaymentEnabled: boolean("directPaymentEnabled").default(false),
    mintUrl: text("mintUrl").default("https://mint.minibits.cash/Bitcoin"),
    viewCount: integer("viewCount").default(0),
    timeCreated: timestamp("timeCreated", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    timeUpdated: timestamp("timeUpdated", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    timeSold: timestamp("timeSold", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    }),
  },
  table => ({
    sellerIndex: index("idx_listing_seller").on(table.sellerId),
    categoryIndex: index("idx_listing_category").on(table.category),
    statusIndex: index("idx_listing_status").on(table.status),
    locationIndex: index("idx_listing_location").on(table.location),
    priceIndex: index("idx_listing_price").on(table.priceSats),
  }),
)

/** Transactions (Orders) */
export const transaction = pgTable(
  "Transaction",
  {
    id: serial("id").primaryKey().notNull().unique(),
    cuid: text("cuid")
      .notNull()
      .unique()
      .$default(() => createId()),
    listingId: integer("listingId")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    buyerId: integer("buyerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sellerId: integer("sellerId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    priceSats: integer("priceSats").notNull(),
    paymentType: text("paymentType").notNull(), // direct, escrow
    status: text("status").default("pending"), // pending, paid, shipped, delivered, completed, cancelled, disputed
    escrowContractId: text("escrowContractId"), // Agentry escrow contract ID
    escrowStatus: text("escrowStatus"), // created, funded, released, disputed
    lightningInvoice: text("lightningInvoice"), // For direct payment
    paymentProof: text("paymentProof"), // preimage or Cashu token
    shippingAddress: jsonb("shippingAddress"),
    trackingNumber: text("trackingNumber"),
    notes: text("notes"),
    timeCreated: timestamp("timeCreated", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    timePaid: timestamp("timePaid", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    }),
    timeShipped: timestamp("timeShipped", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    }),
    timeDelivered: timestamp("timeDelivered", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    }),
    timeCompleted: timestamp("timeCompleted", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    }),
  },
  table => ({
    buyerIndex: index("idx_transaction_buyer").on(table.buyerId),
    sellerIndex: index("idx_transaction_seller").on(table.sellerId),
    listingIndex: index("idx_transaction_listing").on(table.listingId),
    statusIndex: index("idx_transaction_status").on(table.status),
  }),
)

/** Nostr Direct Messages */
export const message = pgTable(
  "Message",
  {
    id: serial("id").primaryKey().notNull().unique(),
    cuid: text("cuid")
      .notNull()
      .unique()
      .$default(() => createId()),
    transactionId: integer("transactionId")
      .references(() => transaction.id, { onDelete: "cascade" }),
    senderId: integer("senderId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: integer("recipientId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nostrEventId: text("nostrEventId"), // Original Nostr event ID
    content: text("content").notNull(),
    encryptedContent: text("encryptedContent"), // NIP-04 encrypted
    isRead: boolean("isRead").default(false),
    timeCreated: timestamp("timeCreated", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  table => ({
    senderIndex: index("idx_message_sender").on(table.senderId),
    recipientIndex: index("idx_message_recipient").on(table.recipientId),
    transactionIndex: index("idx_message_transaction").on(table.transactionId),
    timeIndex: index("idx_message_time").on(table.timeCreated),
  }),
)

/** Ratings and Reviews */
export const rating = pgTable(
  "Rating",
  {
    id: serial("id").primaryKey().notNull().unique(),
    transactionId: integer("transactionId")
      .notNull()
      .references(() => transaction.id, { onDelete: "cascade" }),
    raterId: integer("raterId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rateeId: integer("rateeId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5 stars
    review: text("review"),
    nostrEventId: text("nostrEventId"), // Posted to Nostr for transparency
    isPublic: boolean("isPublic").default(true),
    timeCreated: timestamp("timeCreated", {
      precision: 3,
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  table => ({
    raterIndex: index("idx_rating_rater").on(table.raterId),
    rateeIndex: index("idx_rating_ratee").on(table.rateeId),
    transactionIndex: uniqueIndex("idx_rating_transaction").on(table.transactionId),
  }),
)

/** Relations */
export const userRelations = relations(user, ({ one, many }) => ({
  session: one(session),
  listings: many(listing),
  sales: many(transaction, { relationName: "seller" }),
  purchases: many(transaction, { relationName: "buyer" }),
  sentMessages: many(message, { relationName: "sender" }),
  receivedMessages: many(message, { relationName: "recipient" }),
  givenRatings: many(rating, { relationName: "rater" }),
  receivedRatings: many(rating, { relationName: "ratee" }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const listingRelations = relations(listing, ({ one, many }) => ({
  seller: one(user, { fields: [listing.sellerId], references: [user.id] }),
  transactions: many(transaction),
}))

export const transactionRelations = relations(transaction, ({ one, many }) => ({
  listing: one(listing, { fields: [transaction.listingId], references: [listing.id] }),
  buyer: one(user, { fields: [transaction.buyerId], references: [user.id], relationName: "buyer" }),
  seller: one(user, { fields: [transaction.sellerId], references: [user.id], relationName: "seller" }),
  messages: many(message),
  ratings: many(rating),
}))

export const messageRelations = relations(message, ({ one }) => ({
  transaction: one(transaction, { fields: [message.transactionId], references: [transaction.id] }),
  sender: one(user, { fields: [message.senderId], references: [user.id], relationName: "sender" }),
  recipient: one(user, { fields: [message.recipientId], references: [user.id], relationName: "recipient" }),
}))

export const ratingRelations = relations(rating, ({ one }) => ({
  transaction: one(transaction, { fields: [rating.transactionId], references: [transaction.id] }),
  rater: one(user, { fields: [rating.raterId], references: [user.id], relationName: "rater" }),
  ratee: one(user, { fields: [rating.rateeId], references: [user.id], relationName: "ratee" }),
}))

/** Types */
export type User = InferSelectModel<typeof user>
export type Session = InferSelectModel<typeof session>
export type Listing = InferSelectModel<typeof listing>
export type Transaction = InferSelectModel<typeof transaction>
export type Message = InferSelectModel<typeof message>
export type Rating = InferSelectModel<typeof rating>

/** Extended Types for UI */
export type ListingWithSeller = Listing & { seller: User }
export type TransactionFull = Transaction & { 
  listing: Listing & { seller: User }
  buyer: User
  seller: User
  messages: Message[]
}
export type MessageFull = Message & { sender: User; recipient: User }
export type RatingFull = Rating & { rater: User; ratee: User; transaction: Transaction }
