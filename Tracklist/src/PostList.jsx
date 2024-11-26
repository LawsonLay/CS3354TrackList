function PostList({ posts, blockedTerms }) {
  const filteredPosts = posts.filter((post) =>
    !blockedTerms.some((term) => post.text.toLowerCase().includes(term))
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-6">
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500">No posts available matching the criteria.</p>
      ) : (
        filteredPosts.map((post, index) => (
          <div key={index} className="p-4 border rounded shadow-md bg-gray-50">
            <p className="mb-2 text-gray-800">{post.text}</p>
            {post.fileType?.startsWith("image") ? (
              <img src={post.fileURL} alt="Uploaded content" className="w-full h-auto rounded-lg" />
            ) : post.fileType?.startsWith("video") ? (
              <video width="100%" height="auto" controls preload="metadata" className="rounded-lg">
                <source src={post.fileURL} type={post.fileType} />
                Your browser does not support the video tag.
              </video>
            ) : post.fileType?.startsWith("audio") ? (
              <audio controls className="w-full">
                <source src={post.fileURL} type={post.fileType} />
                Your browser does not support the audio tag.
              </audio>
            ) : post.fileURL ? (
              <p>File type not supported or missing.</p>
            ) : (
              <p>No file uploaded for this post.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PostList;
