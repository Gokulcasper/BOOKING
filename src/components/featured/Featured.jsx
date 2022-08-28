import useFetch from "../../hooks/useFetch";
import "./featured.css";

const Featured = () => {
  const { data, loading, error } = useFetch(
    "/hotels/countByCity?cities=TamilNadu,Kerala,Karnataka"
  );
  console.log(data);
  return (
    <div className="featured">
      <div className="featuredItem">
        <img
          src="https://www.tamilnadutourism.com/images/tour-packages/card/gangaikondacholapuram.jpg"
          alt=""
          className="featuredImg"
        />
        <div className="featuredTitles">
          <h1>TamilNadu</h1>
          <h2>123 Properties</h2>
        </div>
      </div>
      <div className="featuredItem">
        <img
          src="https://static.toiimg.com/thumb/msid-90495077,width-748,height-499,resizemode=4,imgsize-178792/.jpg"
          alt=""
          className="featuredImg"
        />
        <div className="featuredTitles">
          <h1>Kerala</h1>
          <h2>125 Properties</h2>
        </div>
      </div>
      <div className="featuredItem">
        <img
          src="https://static.toiimg.com/thumb/msid-81460131,width-748,height-499,resizemode=4,imgsize-1147454/.jpg"
          alt=""
          className="featuredImg"
        />
        <div className="featuredTitles">
          <h1>Karnataka</h1>
          <h2>124 Properties</h2>
        </div>
      </div>
    </div>
  );
};

export default Featured;
