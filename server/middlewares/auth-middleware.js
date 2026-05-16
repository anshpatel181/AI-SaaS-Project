import { clerkClient, getAuth } from "@clerk/express";

// middleware to check authentication and premium status
export const auth = async (req, res, next) => {

  try {

    // 1. Get logged-in user ID
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // 2. Fetch full user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // 3. Read plan from publicMetadata
    const plan = user.publicMetadata?.plan || "free";    

    // 4. Read free usage count
    const free_usage = user.privateMetadata?.free_usage || 0;

    // 5. If premium → reset free usage
    if (plan === "premium") {

      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0,
        },
      });

      req.free_usage = 0;

    } else {

      req.free_usage = free_usage;
    }

    // 6. Store values in request
    req.userId = userId;
    req.plan = plan;

    next();

  } catch (error) {

    console.log(error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};