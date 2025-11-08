document.addEventListener("DOMContentLoaded", () => {
  // --- Custom Cursor Logic ---
  const cursorDot = document.querySelector<HTMLElement>(".cursor-dot");
  const cursorOutline = document.querySelector<HTMLElement>(".cursor-outline");

  if (cursorDot && cursorOutline) {
    window.addEventListener("mousemove", (e) => {
      const posX = e.clientX;
      const posY = e.clientY;

      cursorDot.style.left = `${posX}px`;
      cursorDot.style.top = `${posY}px`;

      cursorOutline.animate(
        {
          left: `${posX}px`,
          top: `${posY}px`,
        },
        { duration: 500, fill: "forwards" }
      );
    });

    const interactiveElements = document.querySelectorAll(
      'a, button, input[type="submit"], input[type="url"], select'
    );
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursorOutline.classList.add("grow");
      });
      el.addEventListener("mouseleave", () => {
        cursorOutline.classList.remove("grow");
      });
    });
  }

  // --- Scroll Reveal Animation Logic ---
  const revealElements = document.querySelectorAll<HTMLElement>(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  revealElements.forEach((el) => {
    observer.observe(el);
  });

  // --- View Switching Logic ---
  const landingPage = document.getElementById("landing-page");
  const dashboardPage = document.getElementById("dashboard-page");
  const openButtons = document.querySelectorAll('[data-action="open-dashboard"]');
  const closeButtons = document.querySelectorAll('[data-action="close-dashboard"]');

  const showDashboard = () => {
    if (landingPage && dashboardPage) {
      landingPage.classList.add("hidden");
      dashboardPage.classList.remove("hidden");
      window.scrollTo(0, 0);
    }
  };

  const showLandingPage = () => {
    if (landingPage && dashboardPage) {
      landingPage.classList.remove("hidden");
      dashboardPage.classList.add("hidden");
       window.scrollTo(0, 0);
    }
  };

  openButtons.forEach(button => button.addEventListener('click', showDashboard));
  closeButtons.forEach(button => button.addEventListener('click', showLandingPage));

  // --- Dashboard Functionality ---
  const addVideoForm = document.getElementById("add-video-form");
  const videoUrlInput = document.getElementById("video-url-input") as HTMLInputElement;
  const videoGrid = document.getElementById("video-grid");
  const saveButton = addVideoForm?.querySelector('button[type="submit"]') as HTMLButtonElement;
  const sortDropdown = document.getElementById("sort-videos") as HTMLSelectElement;

  type Video = {
    id: number;
    url: string;
    title: string;
    thumbnail: string;
    platform: string;
  };

  let videos: Video[] = JSON.parse(localStorage.getItem("reelstack_videos") || "[]");
  let currentSort = "date_desc";

  const renderVideos = () => {
    if (!videoGrid) return;
    videoGrid.innerHTML = "";
    if (videos.length === 0) {
        videoGrid.innerHTML = `<p class="text-gray-500 col-span-full text-center">Your saved videos will appear here. Paste a link above to get started!</p>`;
        return;
    }
    
    let sortedVideos = [...videos];

    switch (currentSort) {
        case 'date_asc':
            sortedVideos.sort((a, b) => a.id - b.id);
            break;
        case 'title_asc':
            sortedVideos.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title_desc':
            sortedVideos.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'platform_asc':
            sortedVideos.sort((a, b) => a.platform.localeCompare(b.platform));
            break;
        case 'date_desc':
        default:
            sortedVideos.sort((a, b) => b.id - a.id);
            break;
    }
    
    sortedVideos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'bg-white rounded-lg shadow-md overflow-hidden group';
        videoCard.innerHTML = `
            <div class="relative aspect-video bg-gray-200">
                <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">Watch on ${video.platform}</a>
                </div>
            </div>
            <div class="p-4">
                <h4 class="font-bold truncate" title="${video.title}">${video.title}</h4>
            </div>
        `;
        videoGrid.appendChild(videoCard);
    });
  };

  const fetchVideoMetadata = async (url: string): Promise<Omit<Video, 'id' | 'url'>> => {
      try {
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          console.warn("Could not fetch metadata, using placeholders.", data.error || '');
          throw new Error('Using placeholder data');
        }

        return {
          title: data.title || "Untitled Video",
          thumbnail: data.thumbnail_url || `https://source.unsplash.com/random/400x225?sig=${Math.random()}`,
          platform: data.provider_name || "Web",
        };
      } catch (error) {
        // Fallback to placeholder data generation
        let platform = "Web";
        let title = "Untitled Video";
        if (url.includes('youtube.com') || url.includes('youtu.be')) { platform = "YouTube"; title = "YouTube Video"; } 
        else if (url.includes('instagram.com')) { platform = "Instagram"; title = "Instagram Reel"; } 
        else if (url.includes('tiktok.com')) { platform = "TikTok"; title = "TikTok Video"; }
        return { title, thumbnail: `https://source.unsplash.com/random/400x225?sig=${Math.random()}`, platform };
      }
    };


  const addVideo = async (url: string) => {
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    const videoData = await fetchVideoMetadata(url);
    const newVideo: Video = {
        id: Date.now(),
        url: url,
        ...videoData
    };
    videos.push(newVideo);
    localStorage.setItem("reelstack_videos", JSON.stringify(videos));
    renderVideos();

    if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Save Reel";
    }
  };

  if (addVideoForm) {
      addVideoForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (videoUrlInput && videoUrlInput.value) {
              await addVideo(videoUrlInput.value);
              videoUrlInput.value = "";
          }
      });
  }
  
  if (sortDropdown) {
      sortDropdown.addEventListener('change', () => {
          currentSort = sortDropdown.value;
          renderVideos();
      });
  }

  // Initial render
  renderVideos();
});