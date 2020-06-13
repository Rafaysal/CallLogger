import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import Header from './Header.jsx';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      items: [],
      inboxView: true,
      isLoaded: false,
      showInfo: false,
      id: 0,
      created_at: null,
      direction: null, from: null,
      to: null, via: null, duration: null,
      is_archived: null, call_type: null,
    }
    this.showCallInfo = this.showCallInfo.bind(this)
    this.showInbox = this.showInbox.bind(this)
    this.showArchived = this.showArchived.bind(this)
    this.showCallLog = this.showCallLog.bind(this)
    this.archiveCall = this.archiveCall.bind(this)
  }

  // Displays a log of UNARCHIVED calls when called
  showInbox() {
    //Only executes if it is not currently on inbox view
    if (!this.state.inboxView) {
      //Reset button not present in Inbox view
      let resetButton = document.getElementById('reset')
      resetButton.style.visibility = 'hidden'
      //Place teal colored underline under inbox
      let inbox = document.getElementById('inbox')
      inbox.classList.add('teal');
      //Remove teal colored underline under archived
      let archived = document.getElementById('archived')
      archived.classList.remove('teal');

      this.setState({ inboxView: true, showInfo: false })
      this.handleSwitchView()
    }
  }

  // Displays log of archived calls when called
  showArchived() {
    //Only executes if it is not currently on archived view
    if (this.state.inboxView) {
      //Reset button not present in Archived view
      let resetButton = document.getElementById('reset')
      resetButton.style.visibility = 'visible'
      //Remove teal colored underline under inbox
      let inbox = document.getElementById('inbox')
      inbox.classList.remove('teal');
      //Place teal colored underline under archived
      let archived = document.getElementById('archived')
      archived.classList.add('teal');
      this.setState({ inboxView: false, showInfo: false })

      this.handleSwitchView()
    }
  }

  //Flips all the is_archived values so that call cards appear in correct places in return logic
  handleSwitchView() {
    //Copies items in a dummy variable first so the entire object can be passed back in setstate
    let dummyItems = this.state.items;
    for (let i = 0; i < dummyItems.length; i++) {
      //Neccesary logic for !item.is_archived conditional in the map function
      dummyItems[i].is_archived = !dummyItems[i].is_archived;
    }
    this.setState({ items: dummyItems })
  }

  // Displays detailed information about a specific clicked call
  showCallInfo(item, e) {
    //Reset button hidden in call info view
    let resetButton = document.getElementById('reset')
    resetButton.style.visibility = 'hidden'
    //Show info is set to true - neccesary for conditional statement logic in return
    this.setState({ showInfo: true })
    /*Getting data of the specific call from the database and adding it to the state because
     'item' from the map function is out of scope in the showInfo conditional logic*/
    let url = 'https://aircall-job.herokuapp.com/activities/' + item.id;
    fetch(url)
      .then(response => response.json())
      .then(data => this.setState({
        id: data.id, created_at: data.created_at,
        direction: data.direction + ' Call', from: data.from,
        to: data.to, via: data.via, duration: data.duration,
        is_archived: data.is_archived, call_type: data.call_type
      }));
  }
  //Necessary logic for conditional statements - Detailed call info is no longer in view 
  showCallLog() {
    this.setState({ showInfo: false })
    let sound = new Audio('public/images/archive2.mp3');
    sound.play();
  }

  archiveCall() {

    //Sending post request to the database using id to archive a specific call. 
    let url2 = 'https://aircall-job.herokuapp.com/activities/' + this.state.id;
    fetch(url2, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ is_archived: true })
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });

    //Updating things on the front-end using a dummy variable. The previous logic only ensures that things change upon refresh
    let dummyState = this.state.items;
    for (let i = 0; i < dummyState.length; i++) {
      if (this.state.items[i].id === this.state.id) {
        if (dummyState[i]['is_archived'] == false) {
          let sound = new Audio('public/images/archive2.mp3');
          sound.play();
        }
        dummyState[i]['is_archived'] = true
      }
    }
    this.setState({ items: dummyState })
  }

  //Reset button which refreshes the page and removes all the calls from the archived list
  reset() {
    fetch('https://aircall-job.herokuapp.com/reset')
      .then(response => response.json())
      .then(data => {
        console.log(data)
        window.location.reload(false);
      })

  }

  //Fetching the data
  componentDidMount() {
    fetch('https://aircall-job.herokuapp.com/activities')
      .then(response => response.json())
      .then(data => this.setState({ items: data, isLoaded: true }));
  }


  render() {
    //Storing the fetched state in an items variable to be used in return logic
    let items = this.state.items;
    //Ensures the data is loaded before returning and potentially running in to errors
    let isLoaded = this.state.isLoaded;
    if (!isLoaded) {
      return <div>Loading data..</div>
    }

    //Sorting the data by created date
    let sortedItems = items.sort((a, b) => b.date - a.date)

    //Setting the source for images of incoming and outgoing calls
    let srcInbound = "public/images/incoming.png";
    let srcOutbound = "public/images/outgoing.png";



    return (

      <div className='container'>
        <Header />
        {/* Contains event handlers that toggle between inbox and archived views*/}
        <section className='options'>
          <div className='teal' id='inbox' onClick={this.showInbox}>Inbox</div>
          <div id='archived' onClick={this.showArchived}>Archived</div>
        </section>
        {/* Archive reset button*/}
        <button onClick={this.reset} id='reset'>Reset archive</button>

        {/* Creating a conditional loop for when a caller card is clicked and call info is shown*/}
        {!this.state.showInfo ?
          <div className="container-view">
            <ul>
              {sortedItems.map(item => (
                <div key={item.id}>

                  {!item.is_archived ? <div>
                    <div className='date'>{new Date(item.created_at).toString().slice(4, 7).toUpperCase()
                      + ',' + new Date(item.created_at).toString().slice(7, 15).toUpperCase()}</div>

                    {/* List item has an event handler for when it is clicked and info is displayed*/}
                    <li className='caller-container' onClick={(e) => this.showCallInfo(item, e)}>
                      {/* Setting image src based on whether the call is inbound or outbound*/}
                      {item.direction == 'inbound' ?
                        <img className='call-inbound' src={srcInbound} alt="call-img" /> :
                        <img className='call-outbound' src={srcOutbound} alt="call-img" />}
                      {/* Setting caller card info in a mapped list using fetched data*/}
                      <div className='caller-name'>
                        <div>{item.from}</div>
                        <div className='call-subtext'>{item.call_type == 'missed' ?
                          `Missed ${item.direction} call` :
                          `Answered ${item.direction} call`}
                        </div>
                      </div>

                      {/*Displaying time & converting back from GMT time reset when using new Date function by adding 4 hr*/}
                      <span className='time'>{parseInt(new Date(item.created_at).toString().slice(16, 18)) + 4
                        + new Date(item.created_at).toString().slice(18, 21)}</span>
                    </li>
                  </div> : null}

                </div>))}
              {/*Map function and card listing ends here*/}
            </ul>
          </div> : <section>
            {/* The following container is for the detailed call view*/}
            <div className='call-type'>{this.state.call_type + ' ' + this.state.direction}</div>

            <div className='date-info'>
              {/* Manipulating the created_at object to get the date in the format we want and avoiding GMT times*/}
              {new Date(this.state.created_at).toString().slice(4, 7).toUpperCase()
                + ',' + new Date(this.state.created_at).toString().slice(7, 15).toUpperCase()
                + ' ' + parseInt(4 + +new Date(this.state.created_at).toString().slice(16, 18))
                + new Date(this.state.created_at).toString().slice(18, 21)}
            </div>

            <section className='call-info'>
              <div className='info-type'>FROM</div>
              <div className='info-val'>{this.state.from}</div>
            </section>

            <section className='call-info'>
              <div className='info-type'>TO</div>
              <div className='info-val'>{this.state.to ? this.state.to : 'N/A'}</div>
            </section>
            {/* Did not include seconds because all the data was a factor of 60*/}
            <section className='call-info'>
              <div className='info-type'>DURATION</div>
              <div className='info-val'>{Math.floor(this.state.duration / 60) + ' min(s)'}</div>
            </section>

            <section className='call-info'>
              <div className='info-type'>VIA</div>
              <div className='info-val'>{this.state.via}</div>
            </section>

            <section className='buttons-holder'>
              <button onClick={this.showCallLog} className='back'>BACK</button>
              {this.state.inboxView ? <button onClick={this.archiveCall} className='archive'>ARCHIVE</button> : null}
            </section>
          </section>}

      </div>
    );
  }
};

ReactDOM.render(<App />, document.getElementById('app'));

export default App;
