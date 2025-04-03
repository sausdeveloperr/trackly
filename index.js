const tracklyPad = document.querySelector('.tracklyPad');
const taskField = document.querySelectorAll('.taskField');
const doneBtn = document.querySelectorAll('.done');
const addBtn = document.querySelector('#newBtn');
const deleteBtn = document.querySelectorAll('.delete');
const resetBtn = document.querySelector('#reset');

// reset Local Storage data
resetBtn.addEventListener('click', () => {
    localStorage.clear();
    location.reload();
})

// DOM BLOCK FUNCTIONS
// task input & restoration
taskField.forEach((taskField, index) => {
    taskField.addEventListener("input", function() {
        localStorage.setItem(`taskDescription_${index}`, taskField.value);
        localStorage.setItem(`taskState_${index}`, false);
        updateProgress();
    });

    // restore input on refresh
    const savedTask = localStorage.getItem(`taskDescription_${index}`);
    if (savedTask) {
        taskField.value = savedTask;
    }
})

// mark done & restoration [DOM blocks]
doneBtn.forEach((doneBtn, index) => {
    doneBtn.addEventListener('click', function() {
        if (taskField[index].value.trim() === '') return;
        
        this.previousElementSibling.classList.toggle("markdone");
        const isDone = this.previousElementSibling.classList.contains("markdone");
        localStorage.setItem(`taskState_${index}`, isDone);
        updateProgress();
    });

    // restore state on refresh
    const taskState = JSON.parse(localStorage.getItem(`taskState_${index}`));
    if (taskState) {
        taskField[index].value !== '' && doneBtn.previousElementSibling.classList.add("markdone");
    }
});


// clear task field & restoration [DOM blocks]
deleteBtn.forEach((deleteBtn, index) => {
    deleteBtn.addEventListener('click', function() {
        let Sibling = this.previousElementSibling;
        let prevTwoSibling = Sibling.previousElementSibling;

        //clears DOM task field instead of deleting block
        prevTwoSibling.querySelector('.taskField').value = ''; 
        prevTwoSibling.classList.remove("markdone");
        updateProgress(); 

        // update task field status on local storage
        localStorage.setItem(`taskDescription_${index}`, '');
        localStorage.setItem(`taskState_${index}`, false);
    });
});


// CLONE FUNCTIONS
addBtn.addEventListener("click", addNewBlock);

function addNewBlock() {
    const maxBlocks = 7; 
    if (clonesState.length >= maxBlocks) {
        addBtn.removeEventListener('click', addNewBlock, false);
        return;
    }

    // unique clone id
    const newCloneId = clonesState.length ? clonesState[clonesState.length - 1].id + 1 : 1;
    const newClone = {id: newCloneId, text: "", isDone: false};
    clonesState.push(newClone);
    saveState();

    const clonedBlock = createClonedBlock(newCloneId);
    tracklyPad.appendChild(clonedBlock);  
}

let clonesState = JSON.parse(localStorage.getItem("clonesState")) || []; 

// save clone state changes
function saveState() {
    localStorage.setItem("clonesState", JSON.stringify(clonesState));
}

// restore clone blocks from clonesState
function restoreBlocks() {
    clonesState.forEach((clone) => { 
        const clonedBlock = createClonedBlock(clone.id, clone.text, clone.isDone);
        tracklyPad.appendChild(clonedBlock);
    });
}

// clone block creator
function createClonedBlock(cloneId, text = "", isDone) {
    const templateBlock = document.querySelector(".template.hidden");
    const clonedTemplateBlock = templateBlock.cloneNode(true);
    clonedTemplateBlock.classList.remove("hidden");
    clonedTemplateBlock.setAttribute("data-clone-id", `clone-${cloneId}`);

    // restore the clone status for restoreBlocks() 
    const clonedTemplateBlockTaskField = clonedTemplateBlock.querySelector(".taskField");
    const clonedTemplateBlockTaskWrapper = clonedTemplateBlock.querySelector(".taskWrapper");
    clonedTemplateBlockTaskField.value = text;
    isDone && clonedTemplateBlockTaskField.value !== "" && clonedTemplateBlockTaskWrapper.classList.add("markdone");


    // for block changes & addNewBlock() 
    // task input
    clonedTemplateBlockTaskField.addEventListener("input", function () {
        const specificClone = clonesState.find((clone) => clone.id === cloneId); 
        specificClone.text = this.value;
        specificClone.isDone = false;
        saveState();
        updateProgress(); 
    });

    // mark done
    const clonedTemplateBlockDoneBtn = clonedTemplateBlock.querySelector(".done"); 
    clonedTemplateBlockDoneBtn.addEventListener("click", function () {
        clonedTemplateBlockTaskField.value.trim() !== '' && this.previousElementSibling.classList.toggle("markdone"); 
        const specificClone = clonesState.find((clone) => clone.id === cloneId);
        specificClone.isDone = clonedTemplateBlockTaskWrapper.classList.contains("markdone");
        saveState();
        updateProgress();
    });

    // delete clone 
    const clonedTemplateBlockDeleteBtn = clonedTemplateBlock.querySelector(".delete");
    clonedTemplateBlockDeleteBtn.addEventListener("click", function () {
        tracklyPad.removeChild(clonedTemplateBlock);
        clonesState = clonesState.filter((clone) => clone.id !== cloneId);
        saveState();
        updateProgress();
    });

    return clonedTemplateBlock;
}


// page load/refresh restorations
window.addEventListener("DOMContentLoaded", () => {  
    restoreBlocks();  
    restoreProgress();

    // music app restoration
    const spotifyState = JSON.parse(localStorage.getItem('spotifyState'))?.playing;  
    const appleState = JSON.parse(localStorage.getItem('appleState'))?.playing;  
    const youtubeState = JSON.parse(localStorage.getItem('youtubeState'))?.playing;  
    spotifyState ? playSpotify() : appleState ? playAppleMusic() : youtubeState ? playYoutubeMusic() : null;

    // app guide
    const visitCount = localStorage.getItem('visitCount') || 0;
    setTimeout ( () => {
        if (visitCount < 3) {
            helpModal.classList.add('active'); 
            localStorage.setItem('visitCount', `${visitCount + 1}`);
        }  
    }, 2000)      
});


// extra features - na overdo carry me come here swears -_-

// PROGRESS BAR WITH TOOLTIP
function updateProgress() {
    const progressBar = document.querySelector("#progressBar");
    const progressBarWrapper = document.querySelector(".progressBarWrapper");
    if (!progressBar || !progressBarWrapper) return;

    const totalWidth = parseFloat(getComputedStyle(progressBarWrapper).width);

    // count non empty task fields
    const domFilledBlocksFiltered = Array.from(taskField).filter(field => field.value.trim() !== '').length;
    const cloneFilledBlocksFiltered = clonesState.filter(clone => clone.text.trim() !== '').length;
    const totalFilledBlocks = domFilledBlocksFiltered + cloneFilledBlocksFiltered; 

    // count done tasks
    const domBlocksStatusFiltered = Array.from(taskField).filter((field, index) => JSON.parse(localStorage.getItem(`taskState_${index}`)) === true).length;
    const cloneBlocksStatusFiltered = clonesState.filter(clone => clone.isDone).length;
    const totalDoneBlocks = domBlocksStatusFiltered + cloneBlocksStatusFiltered;

    if (totalFilledBlocks === 0) {
        progressBar.style.width = `0px`;
        progressBarWrapper.setAttribute('title', `Progress: 0%`);
        return;
    }

    // calculate new progress width
    const progressPercentage = (totalDoneBlocks / totalFilledBlocks) * 100;
    const progressWidth = (progressPercentage / 100) * totalWidth;

    progressBar.style.color = '#107ea6';
    progressBar.style.width = `${progressWidth}px`;
    progressBarWrapper.setAttribute('title', `Progress: ${progressPercentage.toFixed(1)}%`);

    // save progress
    localStorage.setItem('progressWidth', progressWidth);
    localStorage.setItem('progressBarStatus', progressPercentage);
}

function restoreProgress() {
    const progressBar = document.querySelector("#progressBar");
    const progressBarWrapper = document.querySelector(".progressBarWrapper");
    if (!progressBar || !progressBarWrapper) return;

    const restoredProgressWidth = JSON.parse(localStorage.getItem('progressWidth'));
    const restoredProgressBarStatus = JSON.parse(localStorage.getItem('progressBarStatus'));

    if (restoredProgressWidth && restoredProgressBarStatus) {
        progressBar.style.color = '#107ea6';
        progressBar.style.width = `${restoredProgressWidth}px`;
        progressBarWrapper.setAttribute('title', `Progress: ${restoredProgressBarStatus.toFixed(1)}%`);
    } else {
        progressBar.style.width = `0px`;
        progressBarWrapper.setAttribute('title', `Progress: 0%`);
    }
}


// TOOL BUTTONS
// logic for tools action menu
const toolsBtn = document.querySelector("#toolsBtn");
const toolPlatforms = document.querySelector(".toolPlatforms");
const reset = document.querySelector("#reset");
const musicActionMenu = document.querySelector("#musicActionMenu");
const pomodoro = document.querySelector("#pomodoro");

function toolsShow() {  
    const visibleBtns = Array.from(document.getElementsByClassName('tools'));  

    if (!toolsBtn.classList.contains("move")) {  
        toolsBtn.classList.add("move");  
        
        // .tools button visible & focusable  
        setTimeout(() => {  
            visibleBtns.forEach(unfocusableBtn => {  
                unfocusableBtn.setAttribute("tabindex", "0");  
            });  
            toolPlatforms.classList.add("isOpen");  
            pomodoro.classList.add("show");  
            reset.classList.add("show");  
            musicActionMenu.classList.add("show");  
        }, 200);  
    } else {  
        // .tools button hidden & unfocusable
        visibleBtns.forEach(focusableBtn => {  
            focusableBtn.setAttribute("tabindex", "-1");  
        });  
        
        setTimeout(() => {  
            musicActionMenu.classList.remove("show");  
            reset.classList.remove("show");  
            pomodoro.classList.remove("show");  
            toolPlatforms.classList.remove("isOpen");  
        }, 200);  
        
        setTimeout(() => {  
            toolsBtn.classList.remove("move");  
        }, 300);  
    }  
}  
toolsBtn.addEventListener("click", toolsShow);  

// logic for the pomodoro timer
const pomodoroTimerBtn = document.querySelector("#pomodoro");
pomodoroTimerBtn.addEventListener('click', pomodoroTimer);

function pomodoroTimer() {  
    window.open('https://pomofocus.io/', '_blank'); 
}  

// logic for music action menu
const musicBtn = document.getElementById("music");
const musicPlatforms = document.querySelector(".musicPlatforms");
const musicPlatformApps = document.querySelectorAll(".musicPlatforms button");
const spotify = document.querySelector("#spotify");
const apple = document.querySelector("#apple");
const youtube = document.querySelector("#youtube");

function musicAppsShow() {
  musicPlatforms.classList.add("appIsOpen");
  apple.classList.add("show");
  youtube.classList.add("show");
}

function musicAppsHide() {
  musicPlatforms.classList.remove("appIsOpen");
  apple.classList.remove("show");
  youtube.classList.remove("show");
}

musicBtn.addEventListener("mouseover", musicAppsShow);
musicBtn.addEventListener("mouseleave", musicAppsHide); 
// i know, i just add event listeners to every gaddem problem. i cant help it😭😭

musicPlatformApps.forEach((app) => {
  app.addEventListener("mouseover", musicAppsShow);
  app.addEventListener("mouseleave", musicAppsHide);
});


// logic for music platform apps
const musicContainer = document.querySelector('.bgMusic');

spotify.addEventListener('click', playSpotify);
function playSpotify() {  
    // block other music apps from restoring
    localStorage.setItem('appleState', JSON.stringify({playing: false}));
    localStorage.setItem('youtubeState', JSON.stringify({playing: false}));

    musicContainer.innerHTML = '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/4ifEY9fToX6qzVcaRR0PGt?utm_source=generator&theme=0" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
    const iframe = musicContainer.querySelector('iframe');  
    setTimeout(() => {  
        iframe.style.opacity = '1'; 
    }, 2000); 
    localStorage.setItem('spotifyState', JSON.stringify({playing: true}));
} 

apple.addEventListener('click', playAppleMusic);
function playAppleMusic() {  
    localStorage.setItem('spotifyState', JSON.stringify({playing: false}));
    localStorage.setItem('youtubeState', JSON.stringify({playing: false}));
    
    musicContainer.innerHTML = '<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="450" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/ng/album/upbeat-background-music/1788985522"></iframe>';
    const iframe = musicContainer.querySelector('iframe');  
    setTimeout(() => {  
        iframe.style.opacity = '1'; 
    }, 1000); 
    localStorage.setItem('appleState', JSON.stringify({playing: true}));
} 

youtube.addEventListener('click', playYoutubeMusic);
function playYoutubeMusic() {  
    localStorage.setItem('spotifyState', JSON.stringify({playing: false}));
    localStorage.setItem('appleState', JSON.stringify({playing: false}));
    
    musicContainer.innerHTML = '<iframe style="width:100%;overflow:hidden;border-radius:10px;" height="315" src="https://www.youtube-nocookie.com/embed/zb46cYLFz34?si=LdIuorn_na8PeaN8&amp;start=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    const iframe = musicContainer.querySelector('iframe');  
    musicContainer.classList.add('newDiv');
    setTimeout(() => {  
        iframe.style.opacity = '1'; 
    }, 2000); 
    localStorage.setItem('youtubeState', JSON.stringify({playing: true}));
} 


// APP GUIDE & HELPBTN
const helpModal = document.querySelector('#helpBox');
const tracklyApp = document.querySelector('#tracklyApp');
const helpBtn = document.querySelector('#help');
const closeBtn = document.querySelector('.helpBox-close');

// modal active
helpBtn.addEventListener('click', () => {
  helpModal.classList.add('active'); 
});

// modal inactive
closeBtn.addEventListener('click', () => {
  helpModal.classList.remove('active');
});
tracklyApp.addEventListener('click', (e) => { 
  if (e.target === tracklyApp) {
    helpModal.classList.remove('active');
  }
});



// PWA //
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('Service Worker registered:', registration))
        .catch(err => console.error('SW registration failed:', err));
    });
}

/* thanks for viewing my cute little baby code 🤭 */
