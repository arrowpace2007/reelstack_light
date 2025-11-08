document.addEventListener("DOMContentLoaded", async () => {
  const { GoogleGenAI } = await import("@google/genai");
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
  const videoNotesInput = document.getElementById("video-notes-input") as HTMLTextAreaElement;
  const videoGrid = document.getElementById("video-grid");
  const saveButton = addVideoForm?.querySelector('button[type="submit"]') as HTMLButtonElement;
  const sortDropdown = document.getElementById("sort-videos") as HTMLSelectElement;
  const searchInput = document.getElementById("search-input") as HTMLInputElement;

  type Video = {
    id: number;
    url: string;
    title: string;
    description: string;
    thumbnail: string;
    platform: string;
    tags: string[];
    author?: string;
    savedAt: string;
    notes?: string;
  };

  let videos: Video[] = JSON.parse(localStorage.getItem("reelstack_videos") || "[]");
  let currentSort = "date_desc";
  let searchQuery = "";

  // Initialize Gemini AI
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
  
  if (!API_KEY) {
    console.warn("⚠️ Gemini API key not found. AI-powered tagging will use fallback tags. Add VITE_GEMINI_API_KEY to your environment variables.");
  }

  const generateTags = async (title: string, description: string, url: string, platform: string): Promise<string[]> => {
    if (!genAI) {
      // Better fallback tags based on platform
      const platformTags: Record<string, string[]> = {
        'YouTube': ['youtube', 'video', 'entertainment'],
        'Instagram': ['instagram', 'reel', 'social'],
        'TikTok': ['tiktok', 'short-form', 'viral'],
      };
      return platformTags[platform] || ['video', 'content', 'media'];
    }

    try {
      // Enhanced prompt that works even with limited metadata
      const isShortForm = url.includes('/shorts/') || url.includes('/reel/') || url.includes('tiktok.com');
      const videoType = isShortForm ? 'short-form video' : 'video';
      
      const prompt = `Analyze this ${videoType} and generate 5-7 highly relevant, specific tags/keywords.

Video Information:
- Title: ${title}
- Description: ${description}
- URL: ${url}
- Platform: ${platform}

Instructions:
1. Extract key topics, themes, or subjects from the title and description
2. If metadata is limited (like "YouTube Short" or generic titles), analyze the URL for clues
3. Include content category tags (e.g., tutorial, comedy, music, gaming, cooking, etc.)
4. Add relevant platform-specific tags (e.g., short-form, viral, trending)
5. Be specific and descriptive rather than generic

Return ONLY the tags as a comma-separated list, nothing else.`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      });
      
      const text = result.text || "";
      
      const tags = text.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0 && tag.length < 30);
      return tags.slice(0, 7).length > 0 ? tags.slice(0, 7) : [platform.toLowerCase(), 'video', 'content'];
    } catch (error) {
      console.error("Error generating tags:", error);
      return [platform.toLowerCase(), 'video', 'content'];
    }
  };

  const deleteVideo = (id: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      videos = videos.filter(v => v.id !== id);
      localStorage.setItem("reelstack_videos", JSON.stringify(videos));
      renderVideos();
    }
  };

  const renderVideos = () => {
    if (!videoGrid) return;
    videoGrid.innerHTML = "";
    
    let filteredVideos = videos;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredVideos = videos.filter(video => 
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query)) ||
        video.platform.toLowerCase().includes(query)
      );
    }
    
    if (filteredVideos.length === 0) {
        videoGrid.innerHTML = `<p class="text-gray-500 col-span-full text-center">${searchQuery ? 'No videos found matching your search.' : 'Your saved videos will appear here. Paste a link above to get started!'}</p>`;
        return;
    }
    
    let sortedVideos = [...filteredVideos];

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
        videoCard.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1';
        
        const tagsHTML = video.tags && video.tags.length > 0 
          ? video.tags.map(tag => 
              `<span class="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">${tag}</span>`
            ).join(' ')
          : '<span class="inline-block bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">No tags</span>';
        
        const truncatedDesc = video.description && video.description.length > 100
          ? video.description.substring(0, 100) + '...' 
          : video.description || 'No description available';
        
        const escapedTitle = video.title.replace(/"/g, '&quot;');
        const escapedNotes = video.notes 
          ? video.notes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
          : '';
        
        videoCard.innerHTML = `
            <div class="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                <img src="${video.thumbnail}" alt="${escapedTitle}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400x225?text=No+Thumbnail'">
                <div class="absolute top-3 right-3">
                    <span class="bg-black bg-opacity-80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">${video.platform}</span>
                </div>
            </div>
            <div class="p-5">
                <h4 class="font-bold text-lg mb-2 line-clamp-2 text-gray-900" title="${escapedTitle}">${video.title}</h4>
                ${video.author ? `<p class="text-sm text-gray-600 mb-2 flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>${video.author}</p>` : ''}
                <p class="text-sm text-gray-700 mb-4 leading-relaxed">${truncatedDesc}</p>
                ${escapedNotes ? `<div class="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400 rounded-lg">
                    <p class="text-xs font-semibold text-purple-700 mb-1 flex items-center">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>
                        Your Notes
                    </p>
                    <p class="text-sm text-gray-800 leading-relaxed">${escapedNotes}</p>
                </div>` : ''}
                <div class="flex flex-wrap gap-2 mb-4">
                    ${tagsHTML}
                </div>
                <div class="flex gap-2">
                    <a href="${video.url}" target="_blank" rel="noopener noreferrer" 
                       class="flex-1 text-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg">
                        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path></svg>
                        Watch
                    </a>
                    <button onclick="window.deleteVideo(${video.id})" 
                            class="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg">
                        <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
                    </button>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span class="flex items-center"><svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>Saved ${video.savedAt}</span>
                </div>
            </div>
        `;
        videoGrid.appendChild(videoCard);
    });
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const fetchVideoMetadata = async (url: string): Promise<Omit<Video, 'id' | 'url' | 'tags' | 'savedAt'>> => {
      // Detect platform type
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      const isYouTubeShort = url.includes('/shorts/');
      const isInstagram = url.includes('instagram.com');
      const isInstagramReel = url.includes('/reel/');
      const isTikTok = url.includes('tiktok.com');
      
      // Try YouTube oEmbed for YouTube videos (works better than noembed for Shorts)
      if (isYouTube) {
        try {
          const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (response.ok) {
            const data = await response.json();
            
            // Extract video ID for better thumbnail
            const videoId = extractYouTubeVideoId(url);
            const thumbnail = videoId 
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              : data.thumbnail_url || data.thumbnail;
            
            return {
              title: data.title || (isYouTubeShort ? "YouTube Short" : "YouTube Video"),
              description: data.title || "No description available",
              thumbnail: thumbnail,
              platform: "YouTube",
              author: data.author_name || undefined,
            };
          }
        } catch (error) {
          console.log("YouTube oEmbed failed, trying fallback...");
        }
      }
      
      // Try noembed for other platforms
      try {
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (response.ok && !data.error) {
          return {
            title: data.title || "Untitled Video",
            description: data.description || data.title || "No description available",
            thumbnail: data.thumbnail_url || `https://source.unsplash.com/random/400x225?sig=${Math.random()}`,
            platform: data.provider_name || "Web",
            author: data.author_name || data.author_url || undefined,
          };
        }
      } catch (error) {
        console.log("noembed failed, using platform-specific fallback...");
      }
      
      // Fallback with better defaults
      let platform = "Web";
      let title = "Untitled Video";
      let description = "No description available";
      
      if (isYouTube) { 
        platform = "YouTube"; 
        title = isYouTubeShort ? "YouTube Short" : "YouTube Video";
        description = "Short-form video content";
        
        // Try to get thumbnail from video ID
        const videoId = extractYouTubeVideoId(url);
        if (videoId) {
          return {
            title,
            description,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            platform,
          };
        }
      } else if (isInstagram) { 
        platform = "Instagram"; 
        title = isInstagramReel ? "Instagram Reel" : "Instagram Video";
        description = "Instagram content";
      } else if (isTikTok) { 
        platform = "TikTok"; 
        title = "TikTok Video";
        description = "Short-form TikTok content";
      }
      
      return { 
        title, 
        description,
        thumbnail: `https://source.unsplash.com/random/400x225?sig=${Math.random()}`, 
        platform,
      };
    };

  const addVideo = async (url: string, notes?: string) => {
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Analyzing...";
    }

    try {
      const videoData = await fetchVideoMetadata(url);
      
      if (saveButton) {
        saveButton.textContent = "Generating tags...";
      }
      
      const tags = await generateTags(videoData.title, videoData.description, url, videoData.platform);
      
      const now = new Date();
      const savedAt = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const newVideo: Video = {
          id: Date.now(),
          url: url,
          savedAt,
          tags,
          notes: notes && notes.trim() ? notes.trim() : undefined,
          ...videoData
      };
      
      videos.push(newVideo);
      localStorage.setItem("reelstack_videos", JSON.stringify(videos));
      renderVideos();
    } catch (error) {
      alert("Error saving video. Please try again.");
      console.error(error);
    } finally {
      if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = "Save Video";
      }
    }
  };

  if (addVideoForm) {
      addVideoForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (videoUrlInput && videoUrlInput.value) {
              const notes = videoNotesInput?.value || '';
              await addVideo(videoUrlInput.value, notes);
              videoUrlInput.value = "";
              if (videoNotesInput) {
                videoNotesInput.value = "";
              }
          }
      });
  }
  
  if (sortDropdown) {
      sortDropdown.addEventListener('change', () => {
          currentSort = sortDropdown.value;
          renderVideos();
      });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
      renderVideos();
    });
  }

  // Make deleteVideo available globally
  (window as any).deleteVideo = deleteVideo;

  // Initial render
  renderVideos();
});
