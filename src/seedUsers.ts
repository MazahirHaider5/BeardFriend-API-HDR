import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "./models/users.model.js"; 

const seedUsers = async () => {
  try {
    const uri = process.env.DB_CONNECTION_STRING ?? "";
    await mongoose.connect(uri);
    console.log("✅ Connected to the database");

    await User.deleteMany({});
    console.log("✅ Existing users deleted");

    const users = [
      {
        email: "john.doe@example.com",
        username: "john_doe",
        name: "John Doe",
        phone: "1234567890",
        password: "password123",
        profilephoto: "https://example.com/profiles/john.jpg",
        coverphoto: "https://example.com/covers/john.jpg",
        role: "member",
        is_verified: true,
        language: "English",
        is_two_factor: false,
        show_notification: true,
        news_Updates: false,
        BD_gifts_via_mail: true,
        wishlist: [],
        address: {
          city: "New York",
          state: "NY",
          country: "USA",
          zip: "10001",
          street: "123 Main St",
        },
      },
      {
        email: "jane.smith@example.com",
        username: "jane_smith",
        name: "Jane Smith",
        phone: "9876543210",
        password: "password123",
        profilephoto: "https://example.com/profiles/jane.jpg",
        role: "admin",
        is_verified: false,
        language: "French",
        is_two_factor: true,
        show_notification: false,
        BD_gifts_via_mail: false,
        news_Updates: true,
        wishlist: [
          { refModel: "Product", refId: new mongoose.Types.ObjectId() },
        ],
        billing_address: {
          city: "Los Angeles",
          state: "CA",
          country: "USA",
          zip: "90001",
          street: "456 Elm St",
        },
        shipping_address: {
          city: "San Francisco",
          state: "CA",
          country: "USA",
          zip: "94101",
          street: "789 Pine St",
        },
      },
      {
        email: "jack.bradshaw@example.com",
        username: "jack_bradshaw",
        name: "Jack Bradshaw",
        phone: "98765467732",
        password: "password123",
        profilephoto: "https://example.com/profiles/jane.jpg",
        role: "barber",
        is_verified: false,
        language: "Italian",
        is_two_factor: true,
        show_notification: false,
        BD_gifts_via_mail: false,
        news_Updates: true,
        wishlist: [
          { refModel: "Product", refId: new mongoose.Types.ObjectId() },
        ],
        billing_address: {
          city: "Los Angeles",
          state: "CA",
          country: "USA",
          zip: "90005",
          street: "446 Nl St",
        },
        shipping_address: {
          city: "San Francisco",
          state: "CA",
          country: "USA",
          zip: "94101",
          street: "789 Pine St",
        },
      },
    ];

    await User.insertMany(users);
    console.log("✅ Sample users added successfully");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();
