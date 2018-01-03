(function($){
	$.fn.relatedPosts=function(config){
		var me = this,
			blogId,
			postId;

		var settings = $.extend(true,{
			url: '',
			postId:'',
			labels:[],
			title:'Related Posts: ',
			itemClass: 'related_item',
			wrapperClass: 'related_items_wapper',
			titleClass: 'title',
			shuffle:true,
			thumbUsePost:true,
			thumbWidth:100,
			thumbHeight:75,
			maxPosts: 6
		},config);

		if(!$.isArray(settings.labels)){
			settings.labels = settings.labels.trim().split(',');
		}
		return init();

		function init(){
			$.ajax({
			    url: settings.url + '/feeds/posts/default?alt=json&max-results=500',
			    type: 'get',
			    dataType: "jsonp",
			    cache:true,
			    success: function(data){
			    	// get the blog feed id
			    	blogId = data.feed.id.$t;
			    	if(settings.postId !== ''){
				    	// get the current post id
				    	postId = blogId + '.post-' + settings.postId;
			    	}
			    	// get related posts
			    	var posts = findRelatedPosts(data.feed.entry);
			        // add section title
			        me.append($('<h2/>').text(settings.title));
			        var wrapper = $('<div/>',{'class':settings.wrapperClass});
			    	// construct the output
			        for (var i = 0; i < posts.length; i++){
			        	var entry = posts[i];
			        	var href = getLink(entry);
			        	// the link
			        	var link = $('<a/>',{'href':href});
			        	// the thumbnail
			        	var thumb = findThumbnail(entry,entry.title.$t);
			        	// the post title
			        	var pTitle = $('<div/>',{'class':settings.titleClass});
			        	// the item block
			        	var div = $('<div/>',{'class':settings.itemClass});
			        	// add thumbnail
			        	div.append(thumb);
			            // wrap the link
			            //thumb.wrap(link);
			        	// add post title
	                    div.append(pTitle);
	                    pTitle.append(link.text(entry.title.$t));
	                    // add the item block
			            wrapper.append(div);
			            div.click(function() { window.location = href; })
			        }
			        me.append(wrapper);
			        // clear the layout
			      	me.append('<div style="clear:both;"></div>');
			    }
			});			
		}

		// gets the entry link
		function getLink(entry){
			var href = '#';
			$.each(entry.link, function(i, v){
				if(v.rel=='alternate'){
					href = v.href;
					return false;
				};
			});
			return href;
		}

		// find related entries
		function findRelatedPosts(entries){
			var posts = [];
			var cats = settings.labels;

			for (var i = 0; i < entries.length; i++){
				if(!matchCurrentPost(entries[i])){				
					if(matchCategory(entries[i],cats)){
						posts.push(entries[i]);
					}
				}
			}
			// shuffle array
			if(settings.shuffle){
				posts.sort(function() { return 0.5 - Math.random() });
			}
			return posts.slice(0,settings.maxPosts);
		}

		function findThumbnail(entry, title){
			if(settings.thumbUsePost){
				if(entry.content){
					var div = $('<div/>').html(entry.content.$t);
					var imgs = div.find('img');
					if(imgs.length > 0){					
						return $('<img/>',{'src':imgs[0].src, 'alt': imgs[0].alt, 'title': title, 'width':settings.thumbWidth,'height':settings.thumbHeight});
					}
				}
			}else{
				return $('<img/>',{'src':entry.media$thumbnail.url,'title': title,'alt':title,'width':entry.media$thumbnail.width,'height':entry.media$thumbnail.height});
			}
		}

		function matchCurrentPost(entry){
			var match = false;
			if(postId){
				var id = entry.id.$t
				match = (id == postId);				
			}else{
				var href = location.href.replace(location.hash,'');
				href = href.split('?')[0].toLowerCase();
				$.each(entry.link, function(i,v){
					if(v.rel == 'alternate'){
						if(v.href.toLowerCase() == href){
							match = true;
							return false;
						}
					}
				});
			}
			return match;
		}

		// find any matched category
		function matchCategory(entry, tags){
			if(entry.category){
				for(var i = 0; i < entry.category.length; i++){
					var tag = entry.category[i].term;
					if($.inArray(tag,tags) >= 0){
						return true;
					}
				}				
			}
			return false;
		}
	};
})(jQuery);;


