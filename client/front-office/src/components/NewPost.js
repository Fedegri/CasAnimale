import React, { useState } from "react";
import PostManage from "../services/PostManage";

const NewPost = () => {
  const sendData = async (data) => {
      data.preventDefault();
      const msg = await PostManage.addPost({
        userid: '633571693fe3081bc6c74ee0',
        title,
        description
      });
      alert(msg.data.message);
      window.location.reload();
    };
  
    const [userid, setUsrId] = useState([]);    /* come trovo l'id dell'utente loggato? */
    const [title, setTitle] = useState([]);
    const [description, setDescription] = useState([]);

    return(
    <div
      data-theme="lemonade"
      className="flex flex-1 justify-center"
    >
      <div
        className=" hidden sm:flex flex-1 justify-center"
      >
        <div
          className="flex justify-center"
          style={{ width: "90%", flex: "0 1 auto", alignItems: "center"}}
        >
          <form onSubmit={sendData} className="flex justify-center w-full">
            <div className="m-auto card justify-center w-full ">
              <div className="card-body text-center">
                <div className="card-title justify-center">
                  Create a new post!
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type the title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Title"
                    className="input input-bordered"
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type the description of the post</span>
                  </label>
                  <textarea className="input input-bordered w-full" placeholder="Type the text" onChange={(e) => setDescription(e.target.value)}>
                  </textarea>
                </div>
                <div>
                  <button className="btn btn-secondary m-1">Post</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    );
};

export default NewPost;