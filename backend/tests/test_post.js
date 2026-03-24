async function testPost() {
  try {
    const res1 = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test_wishlist_user", password: "password123" })
    });
    const data1 = await res1.json();
    if(!data1.token) return console.error("Login failed:", data1);

    const res2 = await fetch("http://localhost:5000/api/wishlist", {
      method: "POST",
      headers: { 
        "Authorization": "Bearer " + data1.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bookId: "test_book_123",
        title: "Test Book",
        author: "Mr. Test",
        coverUrl: "http://example.com/cover.jpg"
      })
    });
    console.log("POST status:", res2.status);
    console.log("POST body:", await res2.text());
  } catch (e) {
    console.error(e);
  }
}
testPost();
