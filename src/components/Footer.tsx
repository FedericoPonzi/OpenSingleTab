import React from "react";
import { GIT_HASH, GIT_HASH_SHORT } from "../gitHash";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  // GitHub repository URL - update this with your actual repository URL
  const repoUrl = "https://github.com/FedericoPonzi/OpenSingleTab";
  const commitUrl = `${repoUrl}/commit/${GIT_HASH}`;

  return (
    <footer className={`text-xs text-gray-500 mt-4 text-center ${className}`}>
      <div>
        <span>Version: </span>
        <a
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
          title="View this commit on GitHub"
        >
          {GIT_HASH_SHORT}
        </a>
      </div>
    </footer>
  );
};

export default Footer;