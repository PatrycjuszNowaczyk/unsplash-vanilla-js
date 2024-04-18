const APP_ACCESS = '5qDltfYISWz1VLmuwkiJYz5B0msc00Ezm1BJgCFphVE';
const API_URL = `https://api.unsplash.com/photos/random?client_id=${APP_ACCESS}&count=30`;
const loader = document.querySelector('#loader-wrapper');
const loaderIcon = loader.querySelector('#loader-icon');
const loaderObserver = new IntersectionObserver(loaderCallback, {
  root: null,
  rootMargin: `0px 0px ${2 * window.innerHeight}px 0px`,
  threshold: 0
});

/*---------------------------------------------------------------------------*/

/**
 * Apply loading indicator to an image element while it is loading on its parent element
 * @param {HTMLElement} loadingWrapper - The loading wrapper element
 * @returns {void}
 */
function applyLoadingImgIndicator(loadingWrapper) {
  const textParagraph = document.createElement('p');
  const dotsSpan = document.createElement('span');
  textParagraph.style.position = 'relative';
  dotsSpan.style.position = 'absolute';
  dotsSpan.style.right = '0';
  dotsSpan.style.width = '0';
  textParagraph.innerHTML = 'Loading';
  textParagraph.appendChild(dotsSpan);
  loadingWrapper.appendChild(textParagraph);
  
  // animate loading text three dots at the end
  let dots = 0;
  setInterval(() => {
    dotsSpan.innerText = '.'.repeat(dots);
    dots = (dots + 1) % 4;
  }, 500);
}

/*---------------------------------------------------------------------------*/

/**
 * Set attributes to an element
 * @param {HTMLElement} element - The element to set attributes to
 * @param {Object} attributes - The attributes to set to the element
 * @returns {void}
 */
function setAttributes(element, attributes) {
  for (let key in attributes) {
    element.setAttribute(key, attributes[key]);
  }
}

/*---------------------------------------------------------------------------*/

/**
 * Remove the loading indicator from an image element
 * @param {Event} e - The event object
 * @returns {void}
 */
function removeImgLoading(e) {
  e.target.parentElement.querySelector('.unsplash__img-loading').remove();
}

/*---------------------------------------------------------------------------*/

/**
 * Update the DOM with photos
 * @param {Object[]} photos - An array of photo objects
 * @returns {void}
 */
function updatePhotosContainer(photos) {
  const photoContainer = document.querySelector('.unsplash__container');
  
  function getAspectRatio(photo) {
    return photo.width / photo.height;
  }
  
  
  photos.forEach(photo => {
    const link = document.createElement('a');
    const img = document.createElement('img');
    const loading = document.createElement('div');
    
    applyLoadingImgIndicator(loading);
    
    setAttributes(loading, {
      'class': 'unsplash__img-loading'
    })
    
    setAttributes(link, {
      'href': photo.links.html,
      'target': '_blank',
      'class': 'unsplash__link'
    });
    
    setAttributes(img, {
      'class': 'unsplash__img',
      'loading': 'lazy',
      'alt': photo.alt_description,
      'title': photo.alt_description,
      'style': `aspect-ratio: ${getAspectRatio(photo)}`,
      'src': photo.urls.small_s3,
      'onload': 'removeImgLoading(event)'
    })
    
    link.appendChild(img);
    link.appendChild(loading);
    setTimeout(() => {
      photoContainer.appendChild(link);
    }, 100)
  });
}

/*---------------------------------------------------------------------------*/

/**
 * Fetch photos from unsplash api and update the DOM with the photos
 * @returns {Promise<void>}
 */
async function getPhotos() {
  await fetch(API_URL)
    .then(async response => {
      try {
        const responseClone = response.clone();
        return await responseClone.json();
      } catch (e) {
        const responseClone = response.clone();
        const text = await responseClone.text();
        const error = {
          'text': text,
          'limit': response.headers.get('x-ratelimit-limit'),
          'remaining': response.headers.get('x-ratelimit-remaining')
        }
        throw new Error(JSON.stringify(error));
      }
    })
    .then(data => updatePhotosContainer(data))
    .catch(error => {
      console.error(error)
      loaderIcon.remove();
      loaderObserver.disconnect();
      
      const message = JSON.parse(error.message);
      
      loader.innerHTML = `
        <h5 style="text-align: center">${message.text}</h5>
        <p style="text-align: center">You must wait an hour to reset the rate limit.</p>
        <p style="text-align: center">Limit: ${message.limit} Remaining: ${message.remaining}</p>
      `;
    });
}

/*---------------------------------------------------------------------------*/

/**
 * IntersectionObserver callback function to fetch photos when the loader is in view
 * @type {function(IntersectionObserverEntry[]): void }
 * @param {IntersectionObserverEntry[]} entries - An array of intersection observer entries
 */
function loaderCallback(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      getPhotos()
    }
  });
}

/*---------------------------------------------------------------------------*/

/**
 * IIFE to initialize the app
 * @returns {void}
 */
(function () {
  
  // observe the loader element
  loaderObserver.observe(loader);
  
  
  // context menu event listeners to display the custom context menu
  window.addEventListener('contextmenu', e => {
    e.preventDefault();
    const contextMenu = document.querySelector('#context-menu');
    setAttributes(contextMenu, {
      'style': `
        top: ${e.clientY}px; left: ${e.clientX}px;
      display: block;
      `
    });
    console.log(e);
  });
  
  // hide the context menu when the user clicks outside the context menu
  window.addEventListener('click', e => {
    const contextMenu = document.querySelector('#context-menu');
    contextMenu.style.display = 'none';
  });
})()
