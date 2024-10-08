import ContentSidebar from './ContentSidebar/ContentSidebar';
import ContentMain from './contentMain/ContentMain';
import './MainContent.css';
import { useNavigation } from '../../../context/NavigationContext';

interface IMainContentProps {
  isMobile: boolean;
}

const MainContent = ({ isMobile }: IMainContentProps) => {
  const { activeContentMainComp } = useNavigation();

  return isMobile === true ? (
    <div className='main-content'>
      {activeContentMainComp === true ? <ContentMain /> : <ContentSidebar />}
    </div>
  ) : (
    <div className='main-content'>
      <ContentSidebar />
      <ContentMain />
    </div>
  );
};

export default MainContent;
