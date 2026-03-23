async function test() {
  try {
    const res1 = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test_wishlist_user", password: "password123" })
    });
    const data1 = await res1.json();
    console.log("Login token:", data1.token ? "OK" : data1);

    const res2 = await fetch("http://localhost:5000/api/wishlist", {
      headers: { "Authorization": "Bearer " + data1.token }
    });
    console.log("Wishlist status:", res2.status);
    console.log("Wishlist body:", await res2.text());
  } catch (e) {
    console.error(e);
  }
}
test();
