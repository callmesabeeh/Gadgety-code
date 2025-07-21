let http = new XMLHttpRequest();
http.open('get', 'http://localhost:5000/projects', true);
http.send();
http.onload = function(){
   if(this.readyState == 4 && this.status == 200){
      let products = JSON.parse(this.responseText);
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
         output += `<a href="/product/?id=${item.url}">
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
      document.querySelector(".all-products").innerHTML = output;

      // SEARCH + SORT FUNCTIONALITY
      let currentSortAsc = true;
      const searchInput = document.getElementById('product-search');
      const sortBtn = document.querySelector('.sort');
      const sortIcon = sortBtn ? sortBtn.querySelector('i') : null;
      const categorySelect = document.getElementById('category-select');
      function renderProducts(list) {
        let filteredOutput = "";
        for(let item of list){
          const baseUrl = item.image.substring(0, item.image.lastIndexOf('.'));
          const newUrl = `${baseUrl}_d.webp?maxwidth=750`;
          filteredOutput += `<a href="/product/?id=${item.url}">
                     <div class="product">
                        <div class="product-img" style="background-image:url('${newUrl}');">
                            <span class="discount">${Math.floor(((item.price - item.discountedPrice) / item.price) * 100)}%</span>
                            <div class="icons">
                                <i class="fa fa-heart"></i>
                                <i class="fa fa-eye"></i>
                            </div>
                            <button onclick="add_to_cart('${item.id}', event , 1)" class="add-to-cart">Add To Cart</button>
                        </div>
                        <p class="product-name">
                            ${item.title}
                        </p>
                        <p class="product-price">PKR ${item.discountedPrice} <s>${item.price}</s></p>
                        <span class="rating">
                            <i class="fa fa-star checked"></i>
                            <i class="fa fa-star checked"></i>
                            <i class="fa fa-star checked"></i>
                            <i class="fa fa-star"></i>
                            <i class="fa fa-star"></i>
                            <span class="review-count">(88)</span>
                        </span>
                    </div>
                    </a>
                    `;
        }
        document.querySelector(".all-products").innerHTML = filteredOutput;
      }
      function getFilteredAndSortedProducts() {
        let query = searchInput ? searchInput.value.toLowerCase() : "";
        let selectedCategory = categorySelect ? categorySelect.value : "all";
        let filtered = products.filter(item => {
          let matchesSearch = item.title.toLowerCase().includes(query);
          let matchesCategory = selectedCategory === "all" || (item.category && item.category.toLowerCase() === selectedCategory);
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