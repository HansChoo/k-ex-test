import React from 'react';

export const FloatingButtons: React.FC = () => {
  return (
    <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3">
      {/* WhatsApp */}
      <a 
        href="https://api.whatsapp.com/send/?phone=821073073580&text&type=phone_number&app_absent=0" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.683-2.031-9.667-.272-.099-.47-.149-.669-.149-.198 0-.42.001-.643.001-.223 0-.583.085-.89.421-.307.336-1.173 1.147-1.173 2.798 0 1.651 1.202 3.247 1.369 3.47.168.223 2.365 3.611 5.731 5.064 2.222.959 2.673.766 3.648.718.974-.049 2.146-.877 2.454-1.724.307-.847.307-1.573.215-1.724z"/>
        </svg>
      </a>

      {/* ChannelTalk */}
      <a 
        href="#" 
        onClick={(e) => e.preventDefault()} // Placeholder action
        className="w-14 h-14 bg-[#0070F0] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="none" fill="white"></path>
             {/* Simple eye icon overlay to mimic ChannelTalk logo */}
            <circle cx="12" cy="11.5" r="2" fill="#0070F0" />
        </svg>
      </a>
    </div>
  );
};
