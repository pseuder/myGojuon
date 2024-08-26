import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import WritingPractice from '@/views/WritingPractice.vue'
import ListeningPractice from '@/views/ListeningPractice.vue'
import Backend from '@/views/Backend.vue'
import SongOverview from '@/views/SongOverview.vue'
import SongPractice from '@/views/SongPractice.vue'
import Analysis from '@/views/Analysis.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/writing', component: WritingPractice },
    { path: '/listening', component: ListeningPractice },
    { path: '/song', component: SongPractice },
    { path: '/sdsdwewdewe2wde@@we222', component: Backend },
    { path: '/songOverview', name: 'songOverview', component: SongOverview },
    { path: '/songPractice/:id', name: 'songPractice', component: SongPractice },
    { path: '/analysis', component: Analysis },

    // 添加一個 catch-all 路由
    { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router