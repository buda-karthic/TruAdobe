let productsList = []; // Store fetched products
let displayedProducts = []; // Store products to display
let currentPage = 1; // Track the current page number
const ITEMS_PER_PAGE = 10; // Number of products per page
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const closeBtn = document.getElementById("closeBtn");
const overlay = document.getElementById("overlay");
const menuItems = document.querySelectorAll(".menu-item");
const mobileFilterBtn = document.getElementById("searchbutton");
const resultCountDiv = document.querySelector("#searchresult");
const resultCountbutton = document.querySelector("#searchbutton");
const svgHigh = document.querySelector(".high");
const svgLow = document.querySelector(".low");
const filtersMobBtn = document.querySelector(".filter-result");
// Price Range filter
const priceRangeInput = document.querySelectorAll(".applyPriceRange");
const priceRangeDisplay = document.querySelectorAll(".price-range-display");

// fetching products
async function fetchProducts() {
  showLoading(true);
  try {
    const response = await fetch("https://fakestoreapi.com/products");

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const products = await response.json();
    productsList = products;
    displayedProducts = products; // Initially set displayed products to all fetched products

    // Populate categories dynamically
    populateCategoryFilter(products);

    // Find the highest price in the products list
    const highestPrice =
      Math.max(...products.map((product) => product.price)) + 1;

    // Set the maximum value of the progress bar to the highest price
    const progressBar = document.querySelectorAll(".applyPriceRange");
    progressBar.forEach((priceRangeDisplay) => {
      priceRangeDisplay.max = highestPrice;
      priceRangeDisplay.value = highestPrice;
    });

    // Update the price range display with min and max prices
    const priceRangeDisplays = document.querySelectorAll(
      ".price-range-display"
    );
    priceRangeDisplays.forEach((priceRangeDisplay) => {
      priceRangeDisplay.innerHTML = `$0 - $${highestPrice}`;
    });

    displayPagination(); // Create pagination based on the fetched products
    updateSearchResultCount(); // Update the search result count on load
    displayProductsForPage(currentPage); // Display products for the current page
  } catch (error) {
    handleError(error);
  } finally {
    showLoading(false); // Hide loading shimmer
  }
}

fetchProducts();

filtersMobBtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

svgHigh.addEventListener("click", () => {
  sortProducts("dsc");
});

svgLow.addEventListener("click", () => {
  sortProducts("asc");
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
  });
});

hamburger.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
});

closeBtn.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

overlay.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

mobileFilterBtn.addEventListener("click", () => {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
});

// Debounce function for search input
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Handle errors
function handleError(error) {
  console.error("Error fetching products:", error);
  showError("Failed to load products. Please try again later.");
}

function displayProducts(products) {
  const productList = document.querySelector(".product-list");
  productList.innerHTML = ""; // Clear existing items before displaying new ones

  if (products.length === 0) {
    showError("No products to display.");
    return;
  }

  const productItems = products
    .map((product) => {
      return `
      <li>
        <div class="image-wrapper">
          <a href="#"><img src="${product.image}" alt="${product.title}" /></a>
        </div>
        <div class="variant-desc">
          <div class="product-title">${product.title}</div>
          <div class="price"><span>$</span>${product.price.toFixed(2)}</div>
          <button class="wishlist">
            <img src="./images/wishlist.svg" alt="Add to Wishlist" />
          </button>
        </div>
      </li>
    `;
    })
    .join("");

  productList.innerHTML = productItems;
  updateSearchResultCount(); // Update the search result count after displaying products
}

function populateCategoryFilter(products) {
  const categories = [...new Set(products.map((product) => product.category))]; // Get unique categories
  const categoryFilter = document.getElementById("categoryFilter");
  const desCategoryFilter = document.getElementById("desCategoryFilter");
  categoryFilter.innerHTML = ""; // Clear previous category checkboxes
  desCategoryFilter.innerHTML = ""; // Clear previous category checkboxes

  const categoryItems = categories
    .map((category) => {
      return `<div class='checkbox-wrapper'><input type="checkbox" value="${category}"id='${category}'><label for='${category}'>${category}</label></div>`;
    })
    .join("");
  categoryFilter.innerHTML = categoryItems;
  desCategoryFilter.innerHTML = categoryItems;

  desCategoryFilter
    .querySelectorAll('input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        // Get the value from the search input field
        const query = document.getElementById("searchinput").value;

        // Call filterProducts with the query
        filterProducts(query);
      });
    });
  // Event listener for checkboxes
  categoryFilter
    .querySelectorAll('input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        // Get the value from the search input field
        const query = document.getElementById("searchinput").value;

        // Call filterProducts with the query
        filterProducts(query, false);
      });
    });
}

// Event listener for the search input field (with debounce)
document.getElementById("searchinput").addEventListener(
  "input",
  debounce((event) => {
    const query = event.target.value.toLowerCase();
    filterProducts(query); // Call filterProducts to apply search query
  }, 300)
);

priceRangeInput.forEach((priceInput) => {
  priceInput.addEventListener("input", (event) => {
    const maxPrice = event.target.value;
    priceRangeDisplay.forEach((e) => {
      e.textContent = `0 - $${maxPrice}`;
    });

    filterProductsByPrice(maxPrice); // Filter products based on price range
  });
});

function filterProductsByPrice(maxPrice) {
  // Get the selected categories from the checkboxes
  const selectedCategories = Array.from(
    document.querySelectorAll("#categoryFilter input[type='checkbox']:checked")
  ).map((checkbox) => checkbox.value);

  // Filter the products by price and selected categories
  let filteredProducts = productsList.filter((product) => {
    const matchesPrice = product.price <= maxPrice;
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);

    return matchesPrice && matchesCategory;
  });

  displayedProducts = filteredProducts;
  currentPage = 1; // Reset to page 1
  displayProductsForPage(currentPage); // Display products for the first page
  displayPagination(); // Update pagination
  updateSearchResultCount(); // Update the search result count after filtering
}

function displayPagination() {
  const totalPages = Math.ceil(displayedProducts.length / ITEMS_PER_PAGE);
  const paginationDiv = document.querySelector(".pagination ul");
  paginationDiv.innerHTML = ""; // Clear existing pagination items

  const paginationItems = Array.from({ length: totalPages }, (_, i) => {
    const pageNumber = i + 1;
    return `<li class="${pageNumber === currentPage ? "active" : ""}">
              <a href="#" data-page="${pageNumber}">${pageNumber}</a>
            </li>`;
  }).join("");

  paginationDiv.innerHTML = paginationItems;

  // Event listeners for pagination links
  paginationDiv.querySelectorAll("a").forEach((pageLink) => {
    pageLink.addEventListener("click", (event) => {
      event.preventDefault();
      currentPage = parseInt(event.target.getAttribute("data-page"));
      displayProductsForPage(currentPage);
      displayPagination();
    });
  });
}

function displayProductsForPage(page) {
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = page * ITEMS_PER_PAGE;
  const productsForPage = displayedProducts.slice(startIndex, endIndex);

  displayProducts(productsForPage);
}

// Loading function
function showLoading(isLoading) {
  const shimmer = document.getElementById("shimmer");
  shimmer.style.display = isLoading ? "block" : "none";
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.classList.add("error-message");
  errorDiv.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(errorDiv); // Add the error message to the DOM
}

function sortProducts(order) {
  const sortedProducts = [...displayedProducts];

  sortedProducts.sort((a, b) => {
    return order === "asc" ? a.price - b.price : b.price - a.price;
  });

  displayedProducts = sortedProducts;
  currentPage = 1; // Reset to page 1
  displayProductsForPage(currentPage); // Display products for the first page
  updateSearchResultCount(); // Update the search result count after sorting
}

document.getElementById("sortSelect").addEventListener("change", (event) => {
  sortProducts(event.target.value);
});

function filterProducts(query = "", desCategoryFilter = true) {
  // Ensure query is always a string
  query = String(query).toLowerCase(); // Convert to string and then apply toLowerCase()
  let selectedCategories;

  if (!desCategoryFilter) {
    selectedCategories = Array.from(
      document.querySelectorAll(
        "#categoryFilter input[type='checkbox']:checked"
      )
    ).map((checkbox) => checkbox.value);
  } else {
    selectedCategories = Array.from(
      document.querySelectorAll(
        "#desCategoryFilter input[type='checkbox']:checked"
      )
    ).map((checkbox) => checkbox.value);
  }

  const sortSelectElement = document.getElementById("sortSelect");
  const sortOrder = sortSelectElement ? sortSelectElement.value : "";

  // Filter the products by query and selected categories
  let filteredProducts = productsList.filter((product) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);
    const matchesSearch = product.title.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  if (sortOrder === "asc") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "desc") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  displayedProducts = filteredProducts;
  currentPage = 1;
  displayProductsForPage(currentPage);
  displayPagination();
  updateSearchResultCount();
}

function updateSearchResultCount() {
  if (resultCountDiv) {
    resultCountDiv.innerHTML = `${displayedProducts.length} Result${
      displayedProducts.length !== 1 ? "s" : ""
    }`;
  }
  if (resultCountbutton) {
    resultCountbutton.innerHTML = `See ${displayedProducts.length} Result${
      displayedProducts.length !== 1 ? "s" : ""
    }`;
  }
}
