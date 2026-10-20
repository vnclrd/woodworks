const API_URL = (import.meta as any).env.VITE_API_BASE_URL;

export async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}