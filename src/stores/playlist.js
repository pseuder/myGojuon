// stores/playlist.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { useApi } from "@/composables/useApi.js";

export const usePlaylistStore = defineStore("playlist", () => {
  const MYAPI = useApi();

  // --- State ---
  // 我的最愛：{ source_id, name, ... }[]
  const favorites = ref([]);

  const favoritePlaylistId = ref(null);

  // 自訂播放清單：{ id, name, songs: video[] }[]
  const customPlaylists = ref([]);

  // 是否已從後端初始化完畢
  const isInitialized = ref(false);

  // --- 初始化 ---

  /** 從後端載入所有清單與最愛（頁面 onMounted 呼叫） */
  const fetchPlaylists = async () => {
    try {
      const res = await MYAPI.get("/get_user_playlists");
      if (res.status === "success") {
        favorites.value = res.data.find(
          (item) => item.name === "My Favorite",
        ).songs;
        favoritePlaylistId.value = res.data.find(
          (item) => item.name === "My Favorite",
        ).playlist_id;
        customPlaylists.value = res.data ?? [];
        isInitialized.value = true;
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  // --- 我的最愛 ---

  /** 查詢是否在最愛（同步，直接讀 local state） */
  const isFavorite = (sourceId) => {
    return favorites.value.some((v) => v.source_id === sourceId);
  };

  const toggleFavorite = (source_id) => {
    if (isFavorite(source_id)) {
      removeFavorite(source_id);
      return "移除成功";
    } else {
      addFavorite(source_id);
      return "添加成功";
    }
  };

  /** 切換最愛，回傳新的 is_favorite 值 */
  const addPlaylistSong = async (playlist_id, source_id) => {
    const res = await MYAPI.post("/add_playlist_song", {
      playlist_id: playlist_id,
      source_id: source_id,
    });
    if (res.status === "success") {
      favorites.value = res.data.find(
        (item) => item.name === "My Favorite",
      ).songs;
      customPlaylists.value = res.data ?? [];
    }
  };

  const removePlaylistSong = async (playlist_id, source_id) => {
    const res = await MYAPI.post("/remove_playlist_song", {
      playlist_id: playlist_id,
      source_id: source_id,
    });
    if (res.status === "success") {
      favorites.value = res.data.find(
        (item) => item.name === "My Favorite",
      ).songs;
      customPlaylists.value = res.data ?? [];
    }
  };

  const addFavorite = async (source_id) => {
    addPlaylistSong(favoritePlaylistId.value, source_id);
  };

  const removeFavorite = async (source_id) => {
    removePlaylistSong(favoritePlaylistId.value, source_id);
  };

  // --- 自訂清單 ---

  /** 建立新清單，回傳新清單物件 */
  const createPlaylist = async (name) => {
    const res = await MYAPI.post("/api/playlists", { name: name.trim() });
    if (res.status === "success") {
      customPlaylists.value.push(res.data);
      return res.data;
    }
    throw new Error(res.message);
  };

  /** 刪除清單 */
  const deletePlaylist = async (playlistId) => {
    await MYAPI.del(`/api/playlists/${playlistId}`);
    const idx = customPlaylists.value.findIndex((p) => p.id === playlistId);
    if (idx !== -1) customPlaylists.value.splice(idx, 1);
  };

  /** 改名清單 */
  const renamePlaylist = async (playlistId, newName) => {
    await MYAPI.patch(`/api/playlists/${playlistId}`, {
      name: newName.trim(),
    });
    const pl = customPlaylists.value.find((p) => p.id === playlistId);
    if (pl) pl.name = newName.trim();
  };

  /** 加入歌曲到清單，回傳 true=成功 / false=已存在 */
  const addSongToPlaylist = async (playlistId, video) => {
    try {
      await MYAPI.post(`/api/playlists/${playlistId}/songs`, {
        source_id: video.source_id,
        song_name: video.name,
      });
      const pl = customPlaylists.value.find((p) => p.id === playlistId);
      if (pl && !pl.songs.some((v) => v.source_id === video.source_id)) {
        pl.songs.push({ ...video });
      }
      return true;
    } catch (error) {
      const msg = error.response?.data?.message;
      if (msg === "song_already_in_playlist") return false;
      throw error;
    }
  };

  /** 從清單移除歌曲 */
  const removeSongFromPlaylist = async (playlistId, sourceId) => {
    await MYAPI.del(`/api/playlists/${playlistId}/songs/${sourceId}`);
    const pl = customPlaylists.value.find((p) => p.id === playlistId);
    if (pl) {
      const idx = pl.songs.findIndex((v) => v.source_id === sourceId);
      if (idx !== -1) pl.songs.splice(idx, 1);
    }
  };

  /** 查詢歌曲是否在某清單（同步） */
  const isInPlaylist = (playlistId, sourceId) => {
    const pl = customPlaylists.value.find((p) => p.id === playlistId);
    return pl ? pl.songs.some((v) => v.source_id === sourceId) : false;
  };

  return {
    favorites,
    customPlaylists,
    isInitialized,
    fetchPlaylists,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    isInPlaylist,
  };
  // 不使用 persist：資料由後端管理，無需 localStorage 快取
});
