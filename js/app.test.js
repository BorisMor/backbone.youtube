var appTest = {
    Models:{},
    Collections:{},
    Views:{},
    Routers: {},

    message:{
        normal: 'Добавте URL с YouTube и нажмите "Добавить"',
        error_no_id: 'Не найден код видео',
        error_enter_url: 'Введите URL',
        error_exist_video: 'Видео уже добавлено'
    }
}

/**
 * Видео файл с YouTube
 */
appTest.Models.YouTube = Backbone.Model.extend({
    url: function(){
        return "http://gdata.youtube.com/feeds/api/videos/"+ this.get('id') +"?v=2&alt=jsonc"
    },

    idAttribute: 'id',
    default: {
        id : undefined, // ID
        uploaded : '',  // когда закачено
        title: '',      // заголовок
        description: '',// описание
        thumbnail: ''   // превьюшка
    },

    parse: function(ret){
        var res = ret.data;
        res['thumbnail'] = ret.data.thumbnail.sqDefault;
        return res;
    }
}),

/**
 * Список видео файлов
  */
appTest.Collections.listYouYube = Backbone.Collection.extend({
    model: appTest.Models.YouTube
}),

/**
 * Один элемент
 */
appTest.Views.ViewItemYouTube = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#template-item-video').html()),

    events:{
        'click .js-show-video': 'eventShowVideo',
        'click .js-edit-description': 'eventEditDescription',
        'click .js-edit-title': 'eventEditTitle',
        'click .js-save-edit-value': 'eventSaveEditValue',
        'click .js-cancel-edit-value': 'eventCancelEditValue'
    },

    render: function(){
        this.$el.attr('data-id', this.model.get('id'));
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    eventShowVideo: function(e){
        e.preventDefault();
        var templateShowVideo = _.template($('#template-youtube-embed').html());
        $(e.target).replaceWith(templateShowVideo(this.model.toJSON()));
    },

    /**
     * Перейти в режим редактирования параметра модели
     * @param target    Элемент DOM который вызвал редактирование
     * @param name      Имя редактируемого поля
     */
    setEditElement: function(target, name){
        var edit = {
            'name': name,
            'value': this.model.get(name)
        };

        var templateEdit = _.template($('#template-edit-value').html());
        $(target).replaceWith(templateEdit(edit));
    },

    eventEditTitle: function(e){
        e.preventDefault();
        this.setEditElement(e.target, 'title');
    },

    /**
     * Редактирование описание новости
     * @param e
     */
    eventEditDescription: function(e){
        e.preventDefault();
        this.setEditElement(e.target, 'description');
    },

    /**
     * Сохранить изменение параметра видео
     * @param e
     */
    eventSaveEditValue: function(e){
        var divEdit = $(e.target).closest('.js-edit-value');
        var name = divEdit.data('edit-value');
        var value = this.$('[name="new-value"]', divEdit).val();
        this.model.set(name, value);

        this.render();
    },

    eventCancelEditValue: function(e){
        this.render();
    }

}),

/**
 * Спиоск видео
 */
appTest.Views.ViewListYouTube = Backbone.View.extend({
    tagName: 'ul',
    className: 'list-unstyled',

    initialize: function(data){
        this.collection = new appTest.Collections.listYouYube(data);
        this.listenTo(this.collection, 'add', this.renderItem);
        this.listenTo(this.collection, 'reset', this.renderAll);
    },

    /**
     * Весь список
     */
    render: function(){
        this.$el.empty();
        this.renderAll();
        return this;
    },

    /**
     * Весь список без перетирания
     */
    renderAll: function(){
        this.collection.each(function(item){
            this.renderItem(item);
        },this);
    },

    /**
     * Одно значение
     * @param item
     * @returns {appTest.Views.ViewListYouTube}
     */
    renderItem: function(item){
        var itemView = new appTest.Views.ViewItemYouTube({model: item})
        this.$el.append( itemView.render().$el );
    }
}),

appTest.Views.Main = Backbone.View.extend({
    el: '#input-url-youtube',
    elMessage: undefined,
    elInputUrl: undefined,
    viewList: undefined,

    events:{
        'click .js-add-youtube': 'eventAddYoutube'
    },


    initialize: function(params){
        this.elMessage = this.$('.js-message');
        this.elInputUrl = this.$('input[name="fieldURL"]');
        this.viewList = new appTest.Views.ViewListYouTube({el:'#list-video'});
    },

    addURL: function(url){
        var param = url.match("v=([^&]+)");
        if(param == null){
            this.showMessage(appTest.message.error_no_id);
            return;
        }

        var idVideo = param[1];
        var testModel = this.viewList.collection.get(idVideo);
        if(testModel != undefined){
            this.showMessage(appTest.message.error_exist_video);
            return;
        }

        var modelYoutube = new appTest.Models.YouTube({'id': idVideo});

        var self = this;
        modelYoutube.fetch({
            'success':function(ret){
                self.viewList.collection.add(ret);
                self.showMessage(appTest.message.normal, false);
            },
            'error': function(data, XHR){
                debugger;
                console.log(XHR.responseText);
                
                var json = JSON.parse(XHR.responseText);
                var msg = json.error.code + ": " + json.error.message;
                self.showMessage(msg);
            }
        });
    },

    /**
     * Вывести сообщение
     * @param msg Текст сообщения
     * @param isError Это сообщение о ошибке. По умолчанию true
     */
    showMessage: function(msg, isError){
        isError = (typeof isError == "undefined")? true: false;

        var workClass = isError ? 'label-danger' : 'label-info';
        var deleteClass = isError ? 'label-info' : 'label-danger';

        if ( this.elMessage.hasClass(deleteClass) ) {
            this.elMessage.removeClass(deleteClass).addClass(workClass);
        }

        this.elMessage.text(msg);
    },

    eventAddYoutube: function(e){
        var url = this.elInputUrl.val();
        if(url.length == 0){
            this.showMessage(appTest.message.error_enter_url);
            return;
        }

        this.elMessage.removeClass('error');
        this.addURL(url);
    }
})