var app = new Vue({
    // the root element that will be compiled
    el: '#drillapp',

    // app initial state
    data: {
        tasks: {
            key1: {title: "Dummy data", assignee: "user1", collection: "backlog"},
            key5: {title: "Dummy data", assignee: "user1", collection: "sprint"},
            key7: {title: "Dummy data", assignee: "user1", collection: "in_progress"},
            key8: {title: 'Dummy data', assignee: "user1", collection: "done"}
        },
        natural_order: ['backlog', 'sprint', 'in_progress', 'done'],
        new_task: {
            backlog: "",
            sprint: ""
        },
        user: {},
        users: {
            anonymouse: {karma: 0, email: "secret@service.com", avatar: "img/profile-512.png"}
        },
        updated_info: { title: "", assignee: "", collection: ""}
    },
    ready: function(){
        $('#mainview').hide();
    },
    computed: {
        backlog: function(){
            return Object.keys(this.tasks).filter(key => {return this.tasks[key].collection == 'backlog'}).map(e => {el = this.tasks[e]; el.key = e; return el; })
        },
        sprint: function(){
            return Object.keys(this.tasks).filter(key => {return this.tasks[key].collection == 'sprint'}).map(e => {el = this.tasks[e]; el.key = e; return el; })
        },
        in_progress: function(){
            return Object.keys(this.tasks).filter(key => {return this.tasks[key].collection == 'in_progress'}).map(e => {el = this.tasks[e]; el.key = e; return el; })
        },
        done: function(){
            return Object.keys(this.tasks).filter(key => {return this.tasks[key].collection == 'done'}).map(e => {el = this.tasks[e]; el.key = e; return el; })
        },
        user_email: function(){ return this.user.email; },
        user_avatar: function(){
            if (this.user.karma < 0) return 'img/piglet.png';
            if (this.user.karma > 9) return 'img/unicorn.png';
            if (typeof this.user.avatar === "undefined") return 'img/profile-512.png';
            return this.user.avatar;
        }
    },
    methods: {
        dropHandle: function(item, target) {
            key = item.getAttribute('key');
            source = item.getAttribute('collection-name');
            destination = target.getAttribute('collection-name');
            this.tasks[key].collection = destination;
            console.log("This update should go to DB");
            this.fixKarma(source, destination);
            //this.tasks[key].collection = destination;
        },
        addTask: function(item){
            collection = item.srcElement.getAttribute('collection-name');
            task = { title: this.new_task[collection], collection: collection, assignee: auth.currentUser.uid };
            key = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 16);
            console.log('Task should be added to DB');
            this.tasks[key] = task;
            this.new_task[collection] = "";
        },
        detailView: function(item){
            key = item.target.getAttribute('key');
            task = this.tasks[key];
            message_form = '<div class="row">';
            message_form += '  <div class="form-group"><input class="form-control" type="text" id="updated_title" value="'+task.title+'" /></div>';
            message_form += '  <div class="form_group"><label>Attachment:</label>&nbsp;<input class="form-control" type="file" id="attach_file" /></div>';
            message_form += '  <div class="form_group"><input type="hidden" id="update_attach" value="'+task.attachment+'" /></div>';
            message_form += '  <div class="form_group"><img style="display:none" id="attached_file" src="'+task.attachment_url+'" width="128" height="128" />' +
                '<img style="display:none;" id="remove_icon" src="img/trash-128.png" width="32" height="32" onclick="removeAttach(\''+key+'\')" /></div>';
            message_form += '  <div class="form_group"><label>Assignee:</label>&nbsp;<select class="form-control" id="updated_assignee">';
            message_form += '     <option value="">&lt;unassigned&gt;</option>';
            for (uid of Object.keys(this.users)){
                if (uid == task.assignee) { selected=' selected="on"'; } else { selected = ""; }
                message_form += '        <option value="'+uid+'"'+selected+'>'+this.users[uid].email+'</option>';
            }
            message_form += '   </select></div>';
            message_form += '</div> <!--row -->';
            if ((task.attachment) && (task.attachment !== "undefined")){
                console.log('Read & display attachment file from storage');
            } else {
                $('#attached_file').hide();
                $('#remove_icon').hide();
            }
            bootbox.dialog({
                title: "Detailed view: "+key,
                message: message_form,
                buttons: {
                    attach: {
                        label: "Attach file",
                        className: "btn",
                        callback: function(){
                            console.log('File upload sequense activates here');
                        }
                    },
                    save: {
                        label: "Save",
                        className: "btn-success",
                        callback: function(){
                            updated_task = {};
                            updated_task.title = $('#updated_title').val();
                            updated_task.assignee = $('#updated_assignee').val();
                            if ($('#update_attach').val() !== "") {
                                updated_task.attachment = $('#update_attach').val();
                            }
                            updated_task.collection = task.collection;
                            task = updated_task;
                            console.log("Do not forget to update DB");
                        }
                    },
                    close: {
                        label: "Delete",
                        className: "btn-danger",
                        callback: function(){
                            bootbox.confirm("Are you sure you want to remove this task?", function(result){
                                if (result){
                                    if ((task.attachment) && (task.attachment !== "undefined")) {
                                        console.log('Attachment deletion goes here');
                                    }
                                    console.log('Task removal from DB goes here');
                                }
                            });
                        }
                    }
                }
            });
        },
        fixKarma: function(src, target){
            panels = this.natural_order;
            user = this.users['anonymouse']; /* auth.currentUser.uid] */
            if (panels.indexOf(src) < panels.indexOf(target)){
                user.karma += 1;
            } else {
                user.karma = -1;
            }
            this.users['anonymouse'] = user;
            console.log('Karma should be updated in DB');
        }
    }
});

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validatePassword(pass){
    var re = /^.*(?=.{6,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/;
    return re.test(pass);
}

const auth = firebase.auth();
const storage = firebase.storage();

$('#login-btn').click(function(){
    const email = $('#email_input').val();
    const pass = $('#pass_input').val();
    $('#mainview').show();
    console.log('Should authenticate user');
});

$('#register-btn').click(e => {
    const email = $('#email_input').val();
    if (!validateEmail(email)) { bootbox.alert('Please, check your email'); return; }
    const pass = $('#pass_input').val();
    if (!validatePassword(pass)) { bootbox.alert('Password should contain different symbols and be at least 6 characters'); return; }
    bootbox.prompt({
        title: 'Please, confirm your password',
        inputType: 'password',
        callback: function(result) {
            if (result === pass) {
                console.log('Should add user into Auth registry');
                console.log('when user added, we need to register him in DB');
            } else {
                bootbox.alert('Passwords do not match. Please, type same password twice.');
            }
        }
    });
});

$('#logout-btn').click(function(){
    $('#mainview').hide();
    console.log('Should logout user');
});

function gravatarURL(email){
    return 'http://www.gravatar.com/avatar/'+$.md5(email.trim().toLowerCase())+'fs=48';
}

function removeAttach(task_key){
    bootbox.confirm("Are you sure you want to remove this attachment?", function(result){
        if (result){
            console.log('Contains removal function');
        }
    });
}

