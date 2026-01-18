let http = new XMLHttpRequest();
http.open('get', 'https://cornermobile-backend-f137sj34j-sabeehs-projects-b0bc3c31.vercel.app/projects', true);
http.send();
http.onload = function(){
   if(this.readyState == 4 && this.status == 200){
      let products = JSON.parse(this.responseText);
      // Map _id to id for consistency
      products = products.map(item => ({ ...item, id: item.id || item._id }));
      // Convert price fields to numbers for all products
      products = products.map(item => ({
        ...item,
        price: Number(item.price),
        discountedPrice: Number(item.discountedPrice)
      }));
      // Initial render: always sorted by discountedPrice
      function initialSort(list) {
        return list.slice().sort((a, b) => {
          let priceA = typeof a.discountedPrice === 'number' && !isNaN(a.discountedPrice) ? a.discountedPrice : Number(a.discountedPrice) || 0;
          let priceB = typeof b.discountedPrice === 'number' && !isNaN(b.discountedPrice) ? b.discountedPrice : Number(b.discountedPrice) || 0;
          return priceA - priceB;
        });
      }
      let sortedProducts = initialSort(products);
      let output = "";

      
      for(let item of sortedProducts){
         const baseUrl = item.image.substring(0, item.image.lastIndexOf('.'));
         const newUrl = `${baseUrl}_d.webp?maxwidth=750`;
         output += `<a href="/product/?_id=${item.url}">
                     <div class="product">
                        <div class="product-img" style="background-image:url('${newUrl}');">
                            <span class="discount">${Math.floor(((item.price - item.discountedPrice) / item.price) * 100)}%</span>
                            
                            <button onclick="add_to_cart('${item.id}', event , 1)" class="add-to-cart">Add To Cart</button>
                        </div>
                        <p class="product-name">
                            ${item.title}
                        </p>
                        <p class="product-price">PKR ${item.discountedPrice} <s>${item.price}</s></p>
                       
                    </div>
                    </a>
                    `;
      }
      document.querySelector(".slider-products").innerHTML = output;
      document.getElementById('all-projects').innerHTML = output;

      // Populate categories in the select
      const categorySelect = document.getElementById('category-select');
      const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
      categorySelect.innerHTML = '<option value="all">All Categories</option>';
      categories.sort().forEach(cat => {
          if (cat) {  // Only add if category exists
              const option = document.createElement('option');
              option.value = cat.toLowerCase();
              option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
              categorySelect.appendChild(option);
          }
      });

      // SEARCH + SORT FUNCTIONALITY
      let currentSortAsc = true;
      const searchInput = document.getElementById('product-search');
      const sortBtn = document.querySelector('.sort');
      const sortIcon = sortBtn ? sortBtn.querySelector('i') : null;
      function renderProducts(list) {
        let filteredOutput = "";
        for(let item of list){
          const baseUrl = item.image.substring(0, item.image.lastIndexOf('.'));
          const newUrl = `${baseUrl}_d.webp?maxwidth=750`;
          filteredOutput += `<a href="/product/?_id=${item.url}">
                     <div class="product">
                        <div class="product-img" style="background-image:url('${newUrl}');">
                            <span class="discount">${Math.floor(((item.price - item.discountedPrice) / item.price) * 100)}%</span>
                           
                            <button onclick="add_to_cart('${item.id}', event , 1)" class="add-to-cart">Add To Cart</button>
                        </div>
                        <p class="product-name">
                            ${item.title}
                        </p>
                        <p class="product-price">PKR ${item.discountedPrice} <s>${item.price}</s></p>
                      
                    </div>
                    </a>
                    `;
        }
        document.getElementById("all-projects").innerHTML = filteredOutput;

      }
      function getFilteredAndSortedProducts() {
        let query = searchInput ? searchInput.value.toLowerCase() : "";
        let selectedCategory = categorySelect ? categorySelect.value : "all";
        let filtered = products.filter(item => {
          let matchesSearch = item.title.toLowerCase().includes(query);
          let matchesCategory = selectedCategory === "all" || 
                              (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
          return matchesSearch && matchesCategory;
        });
        // Robust sorting by discountedPrice, handling missing or invalid values
        filtered.sort((a, b) => {
          let priceA = typeof a.discountedPrice === 'number' && !isNaN(a.discountedPrice) ? a.discountedPrice : Number(a.discountedPrice) || 0;
          let priceB = typeof b.discountedPrice === 'number' && !isNaN(b.discountedPrice) ? b.discountedPrice : Number(b.discountedPrice) || 0;
          if (currentSortAsc) {
            return priceA - priceB;
          } else {
            return priceB - priceA;
          }
        });
        return filtered;
      }
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          renderProducts(getFilteredAndSortedProducts());
        });
      }
      if (categorySelect) {
        categorySelect.addEventListener('change', function() {
          renderProducts(getFilteredAndSortedProducts());
        });
      }
      if (sortBtn) {
        sortBtn.style.cursor = 'pointer';
        // Set initial icon direction
        if (sortIcon) sortIcon.style.transform = currentSortAsc ? 'rotate(0deg)' : 'rotate(180deg)';
        sortBtn.addEventListener('click', function() {
          currentSortAsc = !currentSortAsc;
          // Rotate the icon to indicate sort order
          if (sortIcon) sortIcon.style.transform = currentSortAsc ? 'rotate(0deg)' : 'rotate(180deg)';
          renderProducts(getFilteredAndSortedProducts());
        });
      }
   }
}