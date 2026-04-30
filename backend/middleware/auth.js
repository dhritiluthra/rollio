import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  // 1. Grab the token from the header
  const authHeader = req.headers.authorization;

  // 2. Check if token exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, access denied" });
  }

  // 3. Extract just the token part
  // "Bearer eyJhbG..." → "eyJhbG..."
  const token = authHeader.split(" ")[1];

  try {
    // 4. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded : ", decoded);
    // 5. Attach user info to the request object
    // Now any controller can access req.user
    req.user = decoded;

    // 6. Move on to the actual route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const vendorOnly = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Only vendors can do this" });
  }
  next();
};
export default protect;
