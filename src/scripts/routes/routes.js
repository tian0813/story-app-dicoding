//routes.js
import HomePage from '../pages/home/home-page'; 
import AboutPage from '../pages/about/about-page'; 
import AuthPage from '../pages/auth/auth-page'; 
import StoryPage from '../pages/story/story-page'; 
import AddStoryPage from '../pages/add-story/add-story-page'; 
import DetailPage from '../pages/detail/detail-page'; 
import BookmarkPage from '../pages/bookmark/bookmark-page';
import NotFoundPage from '../pages/not-found-page';


const routes = {
  '/': HomePage, 
  '/auth': AuthPage,
  '/add': AddStoryPage,
  '/detail/:id': DetailPage,
  '/bookmarks': BookmarkPage,
  '/about': AboutPage,
  '*': NotFoundPage
};

export default routes;