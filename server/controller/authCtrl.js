const { auth, db } = require("../config/firebase");
const bcrypt = require('bcryptjs')

//admin signUp 
// const signUpController = async (req, res) => {
//     try {
//         const { name, email, password, confirmPassword } = req.body;

//         // Check all fields
//         if (!name || !email || !password || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide all required information',
//             });
//         }

//         // Check password match
//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Passwords do not match',
//             });
//         }

//         let existingUser;
//         try {
//             existingUser = await auth.getUserByEmail(email);
//         } catch (err) {
//             if (err.code !== 'auth/user-not-found') {
//                 throw err; 
//             }
//         }

//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email is already registered',
//             });
//         }
//         // Create user in Firebase Auth
//         const userRecord = await auth.createUser({
//             email,
//             password,
//             displayName: name,
//             emailVerified: false,
//         });

//         // Save admin info to Firestore
//         await db.collection('admins').doc(userRecord.uid).set({
//             name,
//             email,
//             role: 'admin',
//         });

//         res.status(201).json({
//             success: true,
//             message: 'Admin account created successfully',
//             uid: userRecord.uid,
//         });

//     } catch (error) {
//         console.error('Signup error:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Something went wrong',
//         });
//     }
// }

// Sign Up Controller for limited users
// const signUpController = async (req, res) => {
//     try {
//         const { name, email, password, confirmPassword } = req.body;

//         // Check all fields
//         if (!name || !email || !password || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide all required information',
//             });
//         }

//         // Check password match
//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Passwords do not match',
//             });
//         }

//         let existingUser;
//         try {
//             existingUser = await auth.getUserByEmail(email);
//         } catch (err) {
//             if (err.code !== 'auth/user-not-found') {
//                 throw err; 
//             }
//         }

//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email is already registered',
//             });
//         }
//         // Create user in Firebase Auth
//         const userRecord = await auth.createUser({
//             email,
//             password,
//             displayName: name,
//             emailVerified: false,
//         });

//         // Save admin info to Firestore
//         await db.collection('admins').doc(userRecord.uid).set({
//             name,
//             email,
//             role: 'admin',
//         });

//         res.status(201).json({
//             success: true,
//             message: 'Admin account created successfully',
//             uid: userRecord.uid,
//         });

//     } catch (error) {
//         console.error('Signup error:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Something went wrong',
//         });
//     }
// }

// Sign Up Controller for limited users
// const signUpController = async (req, res) => {
//     try {
//         const { name, email, password, confirmPassword } = req.body;

//         // Check all fields
//         if (!name || !email || !password || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Please provide all required information',
//             });
//         }

//         // Check password match
//         if (password !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Passwords do not match',
//             });
//         }

//         let existingUser;
//         try {
//             existingUser = await auth.getUserByEmail(email);
//         } catch (err) {
//             if (err.code !== 'auth/user-not-found') {
//                 throw err; 
//             }
//         }

//         if (existingUser) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email is already registered',
//             });
//         }
//         // Create user in Firebase Auth
//         const userRecord = await auth.createUser({
//             email,
//             password,
//             displayName: name,
//             emailVerified: false,
//         });

//         // Save admin info to Firestore
//         await db.collection('admins').doc(userRecord.uid).set({
//             name,
//             email,
//             role: 'admin',
//         });

//         res.status(201).json({
//             success: true,
//             message: 'Admin account created successfully',
//             uid: userRecord.uid,
//         });

//     } catch (error) {
//         console.error('Signup error:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Something went wrong',
//         });
//     }
// }

// Sign Up Controller for limited users
const signUpController = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required information',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    let existingUser;
    try {
      existingUser = await auth.getUserByEmail(email);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Count existing users
    const usersSnapshot = await db.collection('users').get();
    const userCount = usersSnapshot.size;

    if (userCount >= 5) {
      return res.status(403).json({
        success: false,
        message: 'User limit reached (5 users maximum)',
      });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;
    let role;
    if (userCount === 0) {
      role = 'admin';
    } else {
      role = 'viewer';
    }

    await db.collection('users').doc(uid).set({
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      uid,
      role,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
};

//admin login
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Verify user exists in Firebase Auth
    const userRecord = await auth.getUserByEmail(email);

    // Check if user exists in admins collection
    const userDoc = await db.collection('users').doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User account required.',
      });
    }

    // Create custom token for authentication
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Get admin data
    const userData = userDoc.data();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userData.name,
        role: userData.role,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong',
    });
  }
}

// Register FCM token for notifications
const registerToken = async (req, res) => {
  try {
    const { token } = req.body;

    console.log('Request body:', req.body);
    console.log('User:', req.user);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const userEmail = req.user.email || 'admin@test.com';
    const userUid = req.user.uid || 'test-uid';

    // Save token to Firestore
    await db.collection('fcm_tokens').doc(userEmail).set({
      token,
      email: userEmail,
      uid: userUid,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully',
      data: {
        email: userEmail,
        tokenSaved: true
      }
    });

  } catch (error) {
    console.error('Token registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register token',
      error: error.message
    });
  }
};


module.exports = { signUpController, loginController, registerToken }
