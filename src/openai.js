import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import prompts from "./prompts.js";
import { LightningBoltIcon as LightningBoltIconOutlined } from "@heroicons/react/outline";
import { LightningBoltIcon as LightningBoltIconFilled } from "@heroicons/react/solid";

let personas = [
  "Elon_Musk",
  "Jeff_Bezos",
  "Bill_Gates",
  "Barack_Obama",
  "Gahndi",
];

const OpenAI = () => {
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [unformattedResponse, setUnformattedResponse] = useState("");
  const [loadingChatLog, setLoadingChatLog] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const chatLogRef = useRef(null);
  const [chatModel, setChatModel] = useState("gpt-3.5-turbo");
  const [boltFilled, setBoltFilled] = useState(true);
  const [selectedOption, setSelectedOption] = useState({
    category: "General",
    prompt:
      "As a general knowledge expert, you possess a broad understanding of various subjects, ranging from history, science, technology, and the arts, to culture, society, and current events. Your extensive knowledge base allows you to provide insights, answer questions, and engage in meaningful discussions on a wide array of topics. Whether it's through one-on-one conversations, group discussions, or online resources, your expertise helps individuals expand their horizons, foster curiosity, and gain a deeper appreciation for the world around them. Your ability to communicate complex ideas in a clear and concise manner enables people to learn and grow, while your passion for knowledge-sharing inspires others to seek out information and continue their own lifelong learning journeys. With your guidance, people can develop a well-rounded understanding of the world, empowering them to make informed decisions and engage in thoughtful discourse on a variety of subjects.",
  });

  function sortPromptsAlphabetically(prompts) {
    return prompts.sort((a, b) => {
      if (a.category < b.category) {
        return -1;
      }
      if (a.category > b.category) {
        return 1;
      }
      return 0;
    });
  }

  const sortedPrompts = sortPromptsAlphabetically(prompts);

  const toggleChatModel = () => {
    if (chatModel === "gpt-3.5-turbo") {
      setChatModel("gpt-4");
    } else {
      setChatModel("gpt-3.5-turbo");
    }
    setBoltFilled(!boltFilled);
  };

  const formatResponse = (text) => {
    let formattedText = text;

    // Add line breaks for paragraphs
    formattedText = formattedText.replace(/(\r\n|\n|\r)/gm, "<div></div>");

    // Add syntax highlighting for code snippets
    formattedText = formattedText.replace(
      /```(.*?)```/g,
      "<pre><code>$1</code></pre>"
    );

    return formattedText;
  };
  const handleAddMessage = (newMessage) => {
    setChatLog((prevChatLog) => [...prevChatLog, newMessage]);
  };

  const handleClick = async (e) => {
    handleAddMessage({ role: "user", content: inputValue });
    setIsSending(true);
    await handleSubmit(e);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setInputValue("");
    setIsLoading(true);
    setError(null);
    const newMessage = {
      role: "user",
      content: inputValue,
    };
    const promptMessage = {
      role: "system",
      content: `${selectedOption.prompt}`,
    };
    const messages = [...chatLog, promptMessage, newMessage];

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          messages: messages,
          model: chatModel,
          top_p: 0.1,
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          },
        }
      );
      const formattedResponse = formatResponse(
        response.data.choices[0].message.content
      );
      setUnformattedResponse(response.data.choices[0].message.content);
      setOutputText(formattedResponse);
      setChatLog([
        ...chatLog,
        newMessage,
        {
          role: response.data.choices[0].message.role,
          content: response.data.choices[0].message.content,
          name: selectedOption.category,
        },
      ]);
      setIsSending(false);
    } catch (error) {
      setError(error.response.data.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    setLoadingChatLog([
      ...chatLog,
      { role: "loading", content: "Thinking... this may take some time" },
    ]);
  }, [chatLog]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const formatTimestamp = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black p-4 h-full">
        <div className="w-full bg-black rounded shadow">
          <div className="flex flex-col h-full">
            <div className="flex-grow mb-4 h-[70dvh] md:h-[88dvh] bg-slate-800 rounded-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <div className="overflow-y-auto py-1" ref={chatLogRef}>
                {error && (
                  <div role="alert">
                    <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
                      {error.type}
                    </div>
                    <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                      <p>{error.message}</p>
                      <p>Please Refresh</p>
                    </div>
                  </div>
                )}
                {!isSending &&
                  chatLog.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-1 p-1 rounded-lg ${
                        message.role === "user"
                          ? "text-right text-sky-300"
                          : "text-left text-white"
                      }`}
                    >
                      <div className="w-full">
                        <div className="text-sky-300 max-w-full break-words inline-block whitespace-pre-wrap">
                          {message?.name && message?.name.replace(/_/g, " ")}
                          {!personas.includes(message?.name) &&
                            message?.role === "assistant" &&
                            " Expert"}
                          {message?.name && ": "}
                        </div>
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {/* <p className="text-xs text-gray-400">
                          {formatTimestamp(new Date(message.timestamp))}
                        </p> */}
                      </div>
                    </div>
                  ))}

                {isSending &&
                  loadingChatLog.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-1 p-1 rounded-lg ${
                        message.role === "user"
                          ? "text-right text-sky-300"
                          : "text-left text-white"
                      }`}
                    >
                      <div className="w-full">
                        <div className="text-sky-300 max-w-full break-words inline-block whitespace-pre-wrap">
                          {message?.name && message?.name.replace(/_/g, " ")}
                          {!personas.includes(message?.name) &&
                            message?.role === "assistant" &&
                            " Expert"}
                          {message?.name && ": "}
                        </div>
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <form onSubmit={handleClick} className="flex flex-col sm:flex-row">
              <div className="flex-grow mb-2 sm:mb-0">
                <input
                  className="bg-gray-800 w-full text-white px-4 py-2 rounded-lg flex-1 mb-2 sm:mb-0 sm:mr-2 text-sm sm:text-base lg:text-lg focus:outline-none"
                  type="text"
                  placeholder="Type your message here..."
                  value={inputValue}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-wrap items-center mb-2 sm:mb-0 sm:mx-2">
                <div className="w-[50%] md:w-auto pr-1 mb-2 sm:mb-0 sm:mx-2">
                  <select
                    className={`w-full p-2 border bg-black border-gray-300 rounded text-white`}
                    value={selectedOption.category}
                    onChange={(e) => {
                      const option = sortedPrompts.find(
                        (prompt) => prompt.category === e.target.value
                      );
                      setSelectedOption(option);
                    }}
                  >
                    {sortedPrompts.map((prompt, index) => (
                      <option
                        key={index}
                        value={prompt.category}
                        className={`${
                          selectedOption.category === prompt.category
                            ? "bg-purple-900"
                            : ""
                        }`}
                      >
                        {prompt.category.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-[50%] pl-1 mb-2 sm:mb-0 sm:hidden">
                  <select
                    className="w-full p-2 border bg-black border-gray-300 rounded text-white"
                    value={chatModel}
                    onChange={(e) => {
                      setChatModel(e.target.value);
                    }}
                  >
                    <option value="gpt-3.5-turbo">Fast Response</option>
                    <option value="gpt-4">Quality Response</option>
                  </select>
                </div>
              </div>

              <div className="mb-1 sm:mb-0 sm:ml-1">
                <button
                  className="flex items-center justify-center w-full px-4 py-2.5 text-white bg-purple-900 rounded font-bold"
                  type="submit"
                  disabled={isSending}
                >
                  {isSending ? (
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647zM12 20a8 8 0 01-8-8H0c0 6.627 5.373 12 12 12v-4zm3-5.291a7.962 7.962 0 01-3 2.647V24c3.042 0 5.824-1.135 7.938-3l-2.647-3.009zM12 4a8 8 0 018 8h4c0-6.627-5.373-12-12-12V4z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                  )}
                  {/* <span>Send</span> */}
                </button>
              </div>
              <div className="pb-2 mb-2 sm:mb-0 sm:ml-2 sm:flex items-center justify-center hidden">
                {chatModel === "gpt-3.5-turbo" ? (
                  <LightningBoltIconFilled
                    data-bs-toggle="tooltip"
                    title="GPT-3.5-turbo model"
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 cursor-pointer text-green-400"
                    onClick={toggleChatModel}
                  />
                ) : (
                  <LightningBoltIconOutlined
                    data-bs-toggle="tooltip"
                    title="GPT-4-turbo model"
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 cursor-pointer text-gray-300"
                    onClick={toggleChatModel}
                  />
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpenAI;
