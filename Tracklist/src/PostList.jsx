import React from "react"

function PostList({ posts }) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto mt-6">
        {posts.map((post) => (
          <div key={post.id} className="p-4 border rounded shadow-md">
            <p className="mb-2">{post.text}</p>
            <video width="100%" height="auto" controls preload="metadata">
              <source src={`http://localhost:4000${post.videoPath}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    );
  }
  
  export default PostList;
  
  
  