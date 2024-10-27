import React from 'react';

function PostList({ posts }) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-6">
      {posts.map((post, index) => (
        <div key={index} className="p-4 border rounded shadow-md bg-gray-50">
          <p className="mb-2 text-gray-800">{post.text}</p>
          
          {/* Conditional rendering based on file type */}
          {post.fileType === 'image' ? (
            <img
              src={post.fileURL}
              alt="Uploaded content"
              className="w-full h-auto rounded-lg"
            />
          ) : (
            <video
              width="100%"
              height="auto"
              controls
              preload="metadata"
              className="rounded-lg"
            >
              <source src={post.fileURL} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      ))}
    </div>
  );
}

export default PostList;


  
  
  