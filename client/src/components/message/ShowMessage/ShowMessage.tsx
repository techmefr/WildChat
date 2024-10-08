import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadMessage } from '../../../services/message/fetch/LoadMessage';
import { webSocketService } from '../../../services/webSocketService';
import '../../../App.css';
import './ShowMessage.css';
import { IMessagePostPayload } from '../../../../../common/interface/messageInterface';
import { useScrollToBottom } from '../../../services/useScrollBottom';
import MessageEditor from '../EditMessage/EditMessage';
import { useNavigation } from '../../../context/NavigationContext';
import { ISectionChannel } from '../../../types/sectionTypes';
import { ModalTypeEnum, useModal } from '../../../context/ModalContext';
import DeleteButton from '../../common/button/delete/DeleteButton';
import ModalWrapper from '../../common/modal/ModalWrapper';
import Cookies from 'js-cookie';
import { useUserRole } from '../../../context/UserRoleContext';
const ShowMessage = () => {
  const [messages, setMessages] = useState<IMessagePostPayload[]>([]);
  const [activeEdit, setActiveEdit] = useState<boolean>();
  const [currentIndex, setCurrentIndex] = useState<number>();
  const { setActiveModal, activeModal } = useModal();
  const { currentSection, setCurrentSection } = useNavigation();
  const cookie = JSON.parse(Cookies.get('token') as string);

  const firstname = cookie.userInfo.firstname;

  useEffect(() => {
    // Load messages with redis (init)
    LoadMessage(currentSection)
      .then(setMessages)
      .catch((error) =>
        console.error('Erreur lors du chargement des messages :', error)
      );

    const handleMessage = (payload: IMessagePostPayload) => {
      setMessages((prevMessages) => [...prevMessages, payload]);
    };

    webSocketService.on('message', handleMessage);

    return () => {
      webSocketService.off('message', handleMessage);
    };
  }, [currentSection]);

  const scrollRef = useScrollToBottom(messages);

  const handleEdit = (index: number) => {
    setActiveEdit(true);
    setCurrentIndex(index);
  };

  const activeDelete = (message: string, index: number) => {
    setActiveModal(ModalTypeEnum.DeleteMessage);
    setCurrentIndex(index);
    setCurrentSection((prevState: ISectionChannel) => ({
      ...prevState,
      messageIndex: index,
      currentMessage: message,
    }));
  };

  const updateMessage = (msg: string, index: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((message, i) =>
        i === index ? { ...message, message: msg } : message
      )
    );
  };

  return (
    <div className='messages-container'>
      <div className='h-room_container'>
        {currentSection && (
          <h3 className='h-room'>
            #{currentSection.sectionTitle} : {currentSection.channelTitle}{' '}
          </h3>
        )}
      </div>

      <div className='messages-column' aria-live='polite'>
        {messages.map((message, index) => (
          <div className='message-el' key={index}>
            <span className='name'>{message.name} </span>
            {currentIndex === index &&
            activeEdit === true &&
            firstname === message.name ? (
              <MessageEditor
                name={message.name}
                message={message.message}
                index={index}
                roomId={message.roomId}
                setActiveEdit={setActiveEdit}
                setMessages={setMessages}
                updateMessage={updateMessage}
              />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.message}
              </ReactMarkdown>
            )}
            {firstname === message.name && (
              <div className='span-action_container'>
                <span
                  aria-label='Modifier ce message'
                  className='span-action edit-span'
                  onClick={() => handleEdit(index)}
                >
                  <img
                    src='/icons/edit.png'
                    alt='crayon édition messages'
                    className='icon-edit'
                  />
                </span>
                <DeleteButton
                  action={() => activeDelete(message.message, index)}
                />
              </div>
            )}
          </div>
        ))}
        <ModalWrapper
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          currentSection={currentSection}
          setMessage={setMessages}
        />
        <div ref={scrollRef}></div>
      </div>
    </div>
  );
};

export default ShowMessage;
